import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { testAuthentikConnection } from "@/lib/authentik";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`test-conn:${ip}`, 10, 60_000);
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  const session = await getServerSession(getAuthOptions());
  const user = session?.user as any;

  if (!user?.isAdmin) {
    logger.warn('API', `Jogosulatlan hozzáférési kísérlet a test-connection végponthoz.`);
    return NextResponse.json({ success: false, error: "Nem vagy bejelentkezve adminisztrátorként (403)" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { url, token } = body;
    logger.info('API', `Admin (${user.name}) Authentik kapcsolattesztet indított: ${url || '[alapértelmezett]'}`);

    // SEC-02 FIX: If a custom URL is provided, a custom token MUST also be provided.
    // This prevents the production API token from being sent to an attacker-controlled URL.
    if (url && !token) {
      logger.warn('API', `Admin (${user.name}) egyedi URL-t adott meg token nélkül — a production token nem kerül kiküldésre.`);
      return NextResponse.json({
        success: false,
        error: "Ha egyedi URL-t adsz meg, az API tokent is meg kell adnod. A tárolt token biztonsági okokból nem kerül kiküldésre idegen szerverekre."
      }, { status: 400 });
    }

    const result = await testAuthentikConnection(url, token);
    return NextResponse.json({ 
      success: true, 
      message: `Sikeres kapcsolat az Authentik API-val! ${result.count} alkalmazás elérhető.` 
    });
  } catch (error: any) {
    logger.error('API', `Kapcsolatteszt sikertelen: ${error.message}`);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Nem sikerült kapcsolódni az Authentik szerverhez." 
    }, { status: 400 });
  }
}

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  const user = session?.user as any;

  if (!user?.isAdmin) {
    return NextResponse.json({ success: false, error: "Nem vagy bejelentkezve adminisztrátorként (403)" }, { status: 403 });
  }

  try {
    logger.info('API', `Admin (${user.name}) ellenőrzi az Authentik kapcsolatot (GET)...`);
    const result = await testAuthentikConnection();
    return NextResponse.json({ 
      success: true, 
      message: `Sikeres kapcsolat az Authentik API-val! ${result.count} alkalmazás elérhető.` 
    });
  } catch (error: any) {
    logger.error('API', `Kapcsolat ellenőrzés sikertelen: ${error.message}`);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Nem sikerült kapcsolódni az Authentik szerverhez." 
    }, { status: 400 });
  }
}
