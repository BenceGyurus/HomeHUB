import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

// Short in-memory cache for health check results (15 seconds TTL)
const cache = new Map<string, { result: { status: 'online' | 'offline'; latencyMs: number; statusCode?: number }; timestamp: number }>();
const CACHE_TTL_MS = 15000;

async function checkUrl(targetUrl: string): Promise<{ status: 'online' | 'offline'; latencyMs: number; statusCode?: number }> {
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
      });
    } catch {
      // If HEAD is rejected, try a light GET request
      res = await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'HomeHUB-Monitor/2.5' },
        cache: 'no-store',
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const latencyMs = Date.now() - startTime;

    // HTTP 100-499 means the server is reachable and active (including 200 OK, 301/302 Redirect, 401 Auth Required, 403 Forbidden)
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
  const session = await getServerSession(getAuthOptions());
  // Require logged in user
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const appIds: number[] = body.appIds || [];

    let apps: any[] = [];
    if (appIds.length > 0) {
      const placeholders = appIds.map(() => '?').join(',');
      apps = db.prepare(`SELECT id, name, launch_url, healthcheck_url FROM apps WHERE id IN (${placeholders})`).all(...appIds);
    } else {
      apps = db.prepare('SELECT id, name, launch_url, healthcheck_url FROM apps WHERE is_visible = 1').all();
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
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
