import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// SEC-04 FIX: Sensitive keys that must be masked in GET responses
const SENSITIVE_KEYS = new Set([
  'auth_secret',
  'authentik_client_secret',
  'authentik_api_token',
]);

// SEC-05 FIX: Allowlist of keys that can be written via POST
const ALLOWED_KEYS = new Set([
  'authentik_api_url',
  'authentik_api_token',
  'authentik_client_id',
  'authentik_client_secret',
  'authentik_issuer',
  'app_title',
  'app_language',
]);

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
  
  // SEC-04 FIX: Mask sensitive values before returning to client
  const settings = rows.reduce((acc, row) => {
    if (SENSITIVE_KEYS.has(row.key)) {
      // Return masked value — show only last 4 chars for identification
      const val = row.value || '';
      acc[row.key] = val.length > 4 ? '••••••••' + val.slice(-4) : '••••••••';
    } else {
      acc[row.key] = row.value;
    }
    return acc;
  }, {} as Record<string, string>);
  
  logger.info('SETTINGS', `Beállítások lekérdezve (${rows.length} kulcs, szenzitív értékek maszkozva)`);
  
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

  // SEC-05 FIX: Only allow writing to whitelisted keys
  const rejectedKeys = keys.filter(k => !ALLOWED_KEYS.has(k));
  if (rejectedKeys.length > 0) {
    logger.warn('SETTINGS', `Admin (${user.name}) tried to write restricted keys: ${rejectedKeys.join(', ')}`);
    return NextResponse.json({ 
      error: `A következő kulcsok nem módosíthatók: ${rejectedKeys.join(', ')}` 
    }, { status: 403 });
  }

  // Don't allow writing masked placeholder values back
  const filteredData: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    const strValue = String(value);
    if (strValue.startsWith('••••••••')) {
      // Skip — this is the masked value echoed back from the frontend
      continue;
    }
    filteredData[key] = strValue;
  }

  if (Object.keys(filteredData).length === 0) {
    return NextResponse.json({ success: true, message: "Nincs módosítandó beállítás." });
  }

  logger.info('SETTINGS', `Admin (${user.name}) beállításokat módosított: ${Object.keys(filteredData).join(', ')}`);

  const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  const transaction = db.transaction((settingsObj: Record<string, string>) => {
    for (const [key, value] of Object.entries(settingsObj)) {
      insert.run(key, value);
    }
  });

  transaction(filteredData);
  logger.info('SETTINGS', `Beállítások sikeresen mentve az adatbázisba.`);
  return NextResponse.json({ success: true });
}
