import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Short in-memory cache for health check results (15 seconds TTL)
const cache = new Map<string, { result: { status: 'online' | 'offline'; latencyMs: number; statusCode?: number }; timestamp: number }>();
const CACHE_TTL_MS = 15000;

// SEC-06 FIX: Block dangerous URLs (metadata endpoints, localhost probing)
function isDangerousUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    // Block cloud metadata endpoints
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      return true;
    }

    // Block localhost/loopback (the HomeHUB server itself)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
      return true;
    }

    // Block file:// and other non-http schemes
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return true;
    }

    return false;
  } catch {
    return true; // Invalid URL = block
  }
}

async function checkUrl(targetUrl: string): Promise<{ status: 'online' | 'offline'; latencyMs: number; statusCode?: number }> {
  // SEC-06: Validate URL before probing
  if (isDangerousUrl(targetUrl)) {
    logger.warn('HEALTH', `Blocked dangerous health check URL: ${targetUrl}`);
    return { status: 'offline', latencyMs: 0 };
  }

  const cached = cache.get(targetUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    let res: Response | null = null;
    try {
      res = await fetch(targetUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'HomeHUB-Monitor/2.5' },
        cache: 'no-store',
        redirect: 'manual', // Don't follow redirects to attacker-controlled URLs
      });
    } catch {
      // If HEAD is rejected, try a light GET request
      res = await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'HomeHUB-Monitor/2.5' },
        cache: 'no-store',
        redirect: 'manual',
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const latencyMs = Date.now() - startTime;

    // HTTP 100-499 means the server is reachable and active
    const isOnline = res && res.status > 0 && res.status < 500;
    const result: { status: 'online' | 'offline'; latencyMs: number; statusCode?: number } = {
      status: isOnline ? 'online' : 'offline',
      latencyMs,
      statusCode: res ? res.status : undefined,
    };

    cache.set(targetUrl, { result, timestamp: Date.now() });
    return result;
  } catch {
    const latencyMs = Date.now() - startTime;
    const result: { status: 'online' | 'offline'; latencyMs: number } = { status: 'offline', latencyMs };
    cache.set(targetUrl, { result, timestamp: Date.now() });
    return result;
  }
}

export async function POST(req: NextRequest) {
  // SEC-09: Rate limit health checks
  const ip = getClientIp(req);
  const rl = checkRateLimit(`health:${ip}`, 30, 60_000);
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  const session = await getServerSession(getAuthOptions());
  // Require logged in user
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const appIds: number[] = body.appIds || [];
    const userSession = session.user as any;
    const isAdmin = userSession.isAdmin;

    // SEC-08 FIX: Non-admin users can only check apps they are allowed to see
    let apps: any[] = [];
    if (isAdmin) {
      // Admins can check any app
      if (appIds.length > 0) {
        const placeholders = appIds.map(() => '?').join(',');
        apps = db.prepare(`SELECT id, name, launch_url, healthcheck_url FROM apps WHERE id IN (${placeholders})`).all(...appIds);
      } else {
        apps = db.prepare('SELECT id, name, launch_url, healthcheck_url FROM apps WHERE is_visible = 1').all();
      }
    } else {
      // Non-admin: only check apps assigned to their groups
      const userGroups: string[] = userSession.groups || [];
      if (userGroups.length === 0) {
        return NextResponse.json({ success: true, results: {} });
      }

      const groupPlaceholders = userGroups.map(() => '?').join(',');
      const allowedApps = db.prepare(`
        SELECT DISTINCT a.id, a.name, a.launch_url, a.healthcheck_url 
        FROM apps a
        JOIN app_groups ag ON a.id = ag.app_id
        JOIN groups g ON ag.group_id = g.id
        WHERE g.name IN (${groupPlaceholders}) AND a.is_visible = 1
      `).all(...userGroups) as any[];

      if (appIds.length > 0) {
        const allowedIds = new Set(allowedApps.map((a: any) => a.id));
        apps = allowedApps.filter((a: any) => appIds.includes(a.id) && allowedIds.has(a.id));
      } else {
        apps = allowedApps;
      }
    }

    const results: Record<number, { status: 'online' | 'offline'; latencyMs: number; statusCode?: number }> = {};

    await Promise.all(
      apps.map(async (app) => {
        const target = app.healthcheck_url || app.launch_url;
        if (!target) {
          results[app.id] = { status: 'offline', latencyMs: 0 };
          return;
        }
        results[app.id] = await checkUrl(target);
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    // SEC-12: Don't leak internal errors
    return NextResponse.json({ error: "Belső szerverhiba az állapotellenőrzés során." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const apps = db.prepare('SELECT id, name, launch_url, healthcheck_url FROM apps WHERE is_visible = 1').all() as any[];
    const results: Record<number, { status: 'online' | 'offline'; latencyMs: number; statusCode?: number }> = {};

    await Promise.all(
      apps.map(async (app) => {
        const target = app.healthcheck_url || app.launch_url;
        if (!target) {
          results[app.id] = { status: 'offline', latencyMs: 0 };
          return;
        }
        results[app.id] = await checkUrl(target);
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: "Belső szerverhiba az állapotellenőrzés során." }, { status: 500 });
  }
}
