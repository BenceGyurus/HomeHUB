import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const { name, description, custom_icon, launch_url, category, is_visible } = await req.json();

  try {
    const update = db.prepare(`
      UPDATE apps 
      SET name = ?, description = ?, custom_icon = ?, launch_url = ?, category = ?, is_visible = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    update.run(name, description, custom_icon || null, launch_url, category || 'general', is_visible ? 1 : 0, id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
