import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(getAuthOptions());
  const user = session?.user as any;

  let apps = [];
  try {
    const allApps = db.prepare('SELECT * FROM apps WHERE is_visible = 1 ORDER BY sort_order ASC, name ASC').all() as any[];
    
    if (user?.isAdmin || !user) {
      // Admin vagy vendég látja az összes látható appot
      apps = allApps;
    } else if (user?.provider === 'authentik' && user.groups?.length > 0) {
      // Authentik SSO felhasználó csoportjainak lekérése
      const userGroupNames = user.groups as string[];
      
      const groupRows = db.prepare(`SELECT id, name FROM groups WHERE name IN (${userGroupNames.map(()=>'?').join(',')})`).all(...userGroupNames) as any[];
      const groupIds = groupRows.map(g => g.id);

      if (groupIds.length > 0) {
        const allowedAppRows = db.prepare(`SELECT DISTINCT app_id FROM app_groups WHERE group_id IN (${groupIds.map(()=>'?').join(',')})`).all(...groupIds) as any[];
        const allowedAppIds = allowedAppRows.map(r => r.app_id);
        
        apps = allApps.filter(app => allowedAppIds.includes(app.id));
      } else {
        apps = [];
      }
    }
  } catch (e) {
    console.error(e);
  }

  return (
    <DashboardClient 
      initialApps={apps} 
      user={user ? { name: user.name, email: user.email, isAdmin: user.isAdmin } : null} 
    />
  );
}
