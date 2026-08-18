import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";

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

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const apps = db.prepare('SELECT * FROM apps ORDER BY sort_order ASC, name ASC').all();
  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { name, slug, description, launch_url, healthcheck_url, custom_icon, category, is_visible } = body;

  try {
    const cleanUrl = sanitizeUrl(launch_url);
    const cleanHealthUrl = sanitizeUrl(healthcheck_url);
    const insert = db.prepare(`
      INSERT INTO apps (name, slug, description, launch_url, healthcheck_url, custom_icon, category, is_visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = insert.run(
      name, 
      slug, 
      description || '', 
      cleanUrl, 
      cleanHealthUrl || null, 
      custom_icon || '', 
      category || 'general', 
      is_visible ? 1 : 0
    );
    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
