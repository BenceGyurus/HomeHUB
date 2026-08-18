import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function sanitizeUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }
  if (/^[a-zA-Z0-9.-]+(:\d+)?(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return '';
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { name, description, custom_icon, launch_url, healthcheck_url, category, is_visible } = await req.json();

  try {
    const cleanUrl = sanitizeUrl(launch_url);
    const cleanHealthUrl = sanitizeUrl(healthcheck_url);
    const update = db.prepare(`
      UPDATE apps 
      SET name = ?, description = ?, custom_icon = ?, launch_url = ?, healthcheck_url = ?, category = ?, is_visible = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    update.run(
      name, 
      description, 
      custom_icon || null, 
      cleanUrl, 
      cleanHealthUrl || null, 
      category || 'general', 
      is_visible ? 1 : 0, 
      id
    );
    logger.info('DB', `Alkalmazás (ID: ${id}) sikeresen módosítva.`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('DB', `Hiba az alkalmazás módosításakor (ID: ${id}): ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    db.prepare('DELETE FROM app_groups WHERE app_id = ?').run(id);
    db.prepare('DELETE FROM apps WHERE id = ?').run(id);
    logger.info('DB', `Alkalmazás és csoportkapcsolatai törölve (ID: ${id}).`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('DB', `Hiba az alkalmazás törlésekor (ID: ${id}): ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
