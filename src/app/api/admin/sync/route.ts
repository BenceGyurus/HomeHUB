import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { syncGroups, fetchAuthentikApps } from "@/lib/authentik";
import db from "@/lib/db";

export async function POST() {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const groupsCount = await syncGroups();
    
    // Sync apps
    const apps = await fetchAuthentikApps();
    const insertApp = db.prepare(`
      INSERT OR REPLACE INTO apps (name, slug, description, launch_url, authentik_slug, is_imported)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const transaction = db.transaction((appsList) => {
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

    return NextResponse.json({ 
      success: true, 
      message: `Szinkronizálva ${groupsCount} csoport és ${apps.length} alkalmazás.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
