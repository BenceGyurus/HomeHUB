import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
  const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await req.json();
  const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  const transaction = db.transaction((settingsObj: Record<string, any>) => {
    for (const [key, value] of Object.entries(settingsObj)) {
      insert.run(key, String(value));
    }
  });

  transaction(data);
  return NextResponse.json({ success: true });
}
