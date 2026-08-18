import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  const sessionUser = session?.user as any;

  if (!sessionUser?.isAdmin) {
    logger.warn('AUTH', 'Jogosulatlan jelszómódosítási kísérlet.');
    return NextResponse.json({ error: "Nincs adminisztrátori jogosultságod (403)" }, { status: 403 });
  }

  try {
    const { currentPassword, newPassword, confirmPassword, targetUsername } = await req.json();

    if (!newPassword || newPassword.length < 3) {
      return NextResponse.json({ error: "Az új jelszónak legalább 3 karakter hosszúnak kell lennie." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Az új jelszavak nem egyeznek meg." }, { status: 400 });
    }

    const usernameToUpdate = targetUsername || sessionUser.name || 'admin';
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(usernameToUpdate) as any;

    if (!user) {
      return NextResponse.json({ error: `A(z) "${usernameToUpdate}" felhasználó nem található az adatbázisban.` }, { status: 404 });
    }

    // If current password provided, verify it
    if (currentPassword) {
      const isCurrentMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentMatch) {
        logger.warn('AUTH', `Jelszómódosítás elutasítva: Helytelen jelenlegi jelszó (${usernameToUpdate})`);
        return NextResponse.json({ error: "A megadott jelenlegi jelszó helytelen." }, { status: 400 });
      }
    }

    // Hash new password and update
    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    logger.auth(`Sikeres jelszómódosítás a(z) "${usernameToUpdate}" felhasználónak.`);
    return NextResponse.json({ 
      success: true, 
      message: `A(z) "${usernameToUpdate}" felhasználó jelszava sikeresen megváltozott!` 
    });
  } catch (err: any) {
    logger.error('AUTH', `Hiba a jelszómódosítás során: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
