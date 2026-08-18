import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { syncGroups, fetchAuthentikApps, testAuthentikConnection } from "@/lib/authentik";
import db from "@/lib/db";
import { logger } from "@/lib/logger";
import { findMatchingIcon } from "@/lib/icons";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const status = await testAuthentikConnection();
    return NextResponse.json({ success: true, count: status.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST() {
  const session = await getServerSession(getAuthOptions());
  const user = session?.user as any;
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  logger.info('SYNC', `Admin (${user.name}) elindította az Authentik szinkronizációt.`);

  try {
    const groupsCount = await syncGroups();
    logger.info('SYNC', `Csoportok szinkronizálva: ${groupsCount} csoport.`);
    
    // Sync apps
    const apps = await fetchAuthentikApps();
    logger.info('SYNC', `Authentikből beolvasva: ${apps.length} alkalmazás. Mentés és ikon hozzárendelés indítása...`);

    const insertApp = db.prepare(`
      INSERT INTO apps (name, slug, description, launch_url, custom_icon, category, authentik_slug, is_imported)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        description = CASE WHEN apps.description IS NULL OR apps.description = '' THEN excluded.description ELSE apps.description END,
        launch_url = CASE WHEN apps.launch_url IS NULL OR apps.launch_url = '' THEN excluded.launch_url ELSE apps.launch_url END,
        custom_icon = CASE WHEN apps.custom_icon IS NULL OR apps.custom_icon = '' THEN excluded.custom_icon ELSE apps.custom_icon END,
        category = CASE WHEN apps.category IS NULL OR apps.category = 'general' THEN excluded.category ELSE apps.category END,
        updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = db.transaction((appsList: any[]) => {
      for (const app of appsList) {
        const matching = findMatchingIcon(app.name);
        const iconUrl = app.meta_icon || (matching ? matching.url : '');
        const category = matching ? matching.category : 'general';

        insertApp.run(
          app.name, 
          app.slug, 
          app.meta_description || '', 
          app.meta_launch_url || '', 
          iconUrl,
          category,
          app.slug
        );
      }
    });

    transaction(apps);
    logger.info('SYNC', `Szinkronizáció sikeresen befejeződött: ${groupsCount} csoport, ${apps.length} alkalmazás.`);

    return NextResponse.json({ 
      success: true, 
      message: `Szinkronizálva ${groupsCount} csoport és ${apps.length} alkalmazás automatikus ikonokkal.`
    });
  } catch (error: any) {
    logger.error('SYNC', `Szinkronizációs hiba: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
