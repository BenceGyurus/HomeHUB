import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
  const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  logger.info('SETTINGS', `Beállítások lekérdezve (${rows.length} kulcs)`);
  
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  const user = session?.user as any;
  if (!user?.isAdmin) {
    logger.warn('SETTINGS', `Jogosulatlan módosítási kísérlet a beállításokban.`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await req.json();
  const keys = Object.keys(data);
  logger.info('SETTINGS', `Admin (${user.name}) beállításokat módosított: ${keys.join(', ')}`);

  const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  const transaction = db.transaction((settingsObj: Record<string, any>) => {
    for (const [key, value] of Object.entries(settingsObj)) {
      insert.run(key, String(value));
    }
  });

  transaction(data);
  logger.info('SETTINGS', `Beállítások sikeresen mentve az adatbázisba.`);
  return NextResponse.json({ success: true });
}
