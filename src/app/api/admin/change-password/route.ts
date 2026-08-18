import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 5 minutes
  const ip = getClientIp(req);
  const rl = checkRateLimit(`change-pwd:${ip}`, 5, 5 * 60_000);
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  const session = await getServerSession(getAuthOptions());
  const sessionUser = session?.user as any;

  if (!sessionUser?.isAdmin) {
    logger.warn('AUTH', 'Jogosulatlan jelszómódosítási kísérlet.');
    return NextResponse.json({ error: "Nincs adminisztrátori jogosultságod (403)" }, { status: 403 });
  }

  try {
    const { currentPassword, newPassword, confirmPassword, targetUsername } = await req.json();

    // SEC-01 FIX: currentPassword is ALWAYS required
    if (!currentPassword) {
      logger.warn('AUTH', 'Jelszómódosítás elutasítva: Jelenlegi jelszó nem lett megadva.');
      return NextResponse.json({ error: "A jelenlegi jelszó megadása kötelező." }, { status: 400 });
    }

    // SEC-07 FIX: Enforce strong password policy
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Az új jelszónak legalább ${MIN_PASSWORD_LENGTH} karakter hosszúnak kell lennie.` }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Az új jelszavak nem egyeznek meg." }, { status: 400 });
    }

    const usernameToUpdate = targetUsername || sessionUser.name || 'admin';
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(usernameToUpdate) as any;

    if (!user) {
      // Don't reveal whether user exists
      logger.warn('AUTH', `Jelszómódosítás elutasítva: Ismeretlen felhasználó (${usernameToUpdate})`);
      return NextResponse.json({ error: "A jelszómódosítás sikertelen." }, { status: 400 });
    }

    // SEC-01 FIX: ALWAYS verify current password
    const isCurrentMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentMatch) {
      logger.warn('AUTH', `Jelszómódosítás elutasítva: Helytelen jelenlegi jelszó (${usernameToUpdate})`);
      return NextResponse.json({ error: "A megadott jelenlegi jelszó helytelen." }, { status: 400 });
    }

    // SEC-13 FIX: Use async bcrypt.hash instead of blocking hashSync
    const newHash = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    logger.auth(`Sikeres jelszómódosítás a(z) "${usernameToUpdate}" felhasználónak.`);
    return NextResponse.json({ 
      success: true, 
      message: `A(z) "${usernameToUpdate}" felhasználó jelszava sikeresen megváltozott!` 
    });
  } catch (err: any) {
    logger.error('AUTH', `Hiba a jelszómódosítás során: ${err.message}`);
    // SEC-12 FIX: Don't leak internal error details
    return NextResponse.json({ error: "Belső szerverhiba a jelszómódosítás során." }, { status: 500 });
  }
}
