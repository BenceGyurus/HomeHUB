import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(getAuthOptions());
  const user = session?.user as any;

  let apps: any[] = [];

  // A szolgáltatások KIZÁRÓLAG bejelentkezett felhasználóknak láthatóak
  if (user) {
    try {
      const allApps = db.prepare('SELECT * FROM apps WHERE is_visible = 1 ORDER BY sort_order ASC, name ASC').all() as any[];
      
      if (user.isAdmin) {
        // Adminisztrátor az összes konfigurált szolgáltatást látja
        apps = allApps;
        logger.info('DASHBOARD', `Admin (${user.name}) megnyitotta a főoldalt -> ${apps.length} alkalmazás látható.`);
      } else {
        // Normál bejelentkezett felhasználó: szerepkör és csoport alapú szűrés
        const userGroups: string[] = Array.isArray(user.groups) ? user.groups : [];

        // Lekérjük az összes hozzárendelést
        const appGroupMappings = db.prepare(`
          SELECT ag.app_id, g.name as group_name, g.authentik_pk
          FROM app_groups ag
          JOIN groups g ON ag.group_id = g.id
        `).all() as { app_id: number; group_name: string; authentik_pk: string }[];

        // Mely alkalmazásokhoz van egyáltalán csoportkorlátozás rendelve
        const restrictedAppIds = new Set(appGroupMappings.map(m => m.app_id));

        // Mely alkalmazásokhoz jogosult a felhasználó a saját csoportjai alapján
        const allowedByGroupAppIds = new Set(
          appGroupMappings
            .filter(m => userGroups.includes(m.group_name) || userGroups.includes(m.authentik_pk))
            .map(m => m.app_id)
        );

        // A felhasználó csak a saját csoportjához rendelt (vagy csoport nélküli közös) appokat látja
        apps = allApps.filter(app => {
          if (allowedByGroupAppIds.has(app.id)) return true;
          // Ha az app nincs semmilyen korlátozó csoporthoz rendelve, a bejelentkezett felhasználók láthatják
          if (!restrictedAppIds.has(app.id)) return true;
          return false;
        });

        logger.info('DASHBOARD', `Felhasználó (${user.name}, Csoportok: [${userGroups.join(', ')}]) megnyitotta a főoldalt -> ${apps.length}/${allApps.length} alkalmazás engedélyezve.`);
      }
    } catch (e: any) {
      logger.error('DASHBOARD', `Hiba a dashboard alkalmazások lekérésekor: ${e.message}`);
    }
  } else {
    logger.http(`Látogató (nem bejelentkezett) megnyitotta a főoldalt -> Zárolt állapot megjelenítése.`);
  }

  return (
    <DashboardClient 
      initialApps={apps} 
      user={user ? { name: user.name, email: user.email, isAdmin: user.isAdmin, groups: user.groups } : null} 
    />
  );
}
