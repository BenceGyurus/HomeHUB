import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const groups = db.prepare('SELECT * FROM groups ORDER BY name ASC').all();
  const apps = db.prepare('SELECT id, name FROM apps ORDER BY sort_order ASC, name ASC').all();
  const appGroups = db.prepare('SELECT * FROM app_groups').all();

  return NextResponse.json({ groups, apps, appGroups });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { groupId, appIds } = await req.json();

  try {
    const deleteOld = db.prepare('DELETE FROM app_groups WHERE group_id = ?');
    const insertNew = db.prepare('INSERT INTO app_groups (group_id, app_id) VALUES (?, ?)');
    
    const transaction = db.transaction(() => {
      deleteOld.run(groupId);
      for (const appId of appIds) {
        insertNew.run(groupId, appId);
      }
    });
    
    transaction();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
