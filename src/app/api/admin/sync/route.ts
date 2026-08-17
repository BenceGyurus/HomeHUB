import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { syncGroups, fetchAuthentikApps, testAuthentikConnection } from "@/lib/authentik";
import db from "@/lib/db";
import { logger } from "@/lib/logger";

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
    logger.info('SYNC', `Authentikből beolvasva: ${apps.length} alkalmazás. Mentés indítása...`);

    const insertApp = db.prepare(`
      INSERT OR REPLACE INTO apps (name, slug, description, launch_url, authentik_slug, is_imported)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const transaction = db.transaction((appsList: any[]) => {
      for (const app of appsList) {
        insertApp.run(
          app.name, 
          app.slug, 
          app.meta_description || '', 
          app.meta_launch_url || '', 
          app.slug
        );
      }
    });

    transaction(apps);
    logger.info('SYNC', `Szinkronizáció sikeresen befejeződött: ${groupsCount} csoport, ${apps.length} alkalmazás.`);

    return NextResponse.json({ 
      success: true, 
      message: `Szinkronizálva ${groupsCount} csoport és ${apps.length} alkalmazás.`
    });
  } catch (error: any) {
    logger.error('SYNC', `Szinkronizációs hiba: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
