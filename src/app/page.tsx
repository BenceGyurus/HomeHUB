import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import { LogOut } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(getAuthOptions());
  const user = session?.user as any;

  // Ha nincs bejelentkezve, alapértelmezett appok vagy semmi?
  // Kérdés, hogy publikus appok vannak-e. Tegyük fel, hogy csak bejelentkezve látni mindent,
  // de Authentik mögött az admin is szabályozhatja.
  // Most lekérjük azokat az appokat, amikhez a user-nek van joga, vagy amik láthatóak.

  let apps = [];
  try {
    const allApps = db.prepare('SELECT * FROM apps WHERE is_visible = 1 ORDER BY sort_order ASC, name ASC').all() as any[];
    
    if (user?.isAdmin || !user) {
      // Admin vagy vendég (ha engedélyezzük a vendég hozzáférést) mindent lát, ami visible
      apps = allApps;
    } else if (user?.provider === 'authentik' && user.groups?.length > 0) {
      // Lekérjük a userek csoportjait a nevük alapján (vagy ID, ahogy az authentik adja)
      // A token.groups string tömb (authentik group name-ek)
      const userGroupNames = user.groups as string[];
      
      const groupRows = db.prepare(`SELECT id, name FROM groups WHERE name IN (${userGroupNames.map(()=>'?').join(',')})`).all(...userGroupNames) as any[];
      const groupIds = groupRows.map(g => g.id);

      if (groupIds.length > 0) {
        const allowedAppRows = db.prepare(`SELECT DISTINCT app_id FROM app_groups WHERE group_id IN (${groupIds.map(()=>'?').join(',')})`).all(...groupIds) as any[];
        const allowedAppIds = allowedAppRows.map(r => r.app_id);
        
        // Csak azokat mutatjuk, ami hozzá van rendelve a csoportjaihoz
        apps = allApps.filter(app => allowedAppIds.includes(app.id));
      } else {
        apps = [];
      }
    }
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="container">
      <header className="flex justify-between items-center" style={{ marginBottom: "3rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>HomeHub</h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                Üdv, {user.name}
              </span>
              {user.isAdmin && (
                <Link href="/admin" className="btn">
                  Admin
                </Link>
              )}
              <Link href="/api/auth/signout" className="btn" title="Kijelentkezés">
                <LogOut size={16} />
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">
              Bejelentkezés
            </Link>
          )}
        </div>
      </header>

      <main>
        {apps.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: "4rem 0" }}>
            Nincs megjeleníthető alkalmazás.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {apps.map((app: any) => (
              <a key={app.id} href={app.launch_url || '#'} className="card" target={app.launch_url ? "_blank" : "_self"} rel="noreferrer">
                <div className="flex items-center gap-4" style={{ marginBottom: "0.5rem" }}>
                  {app.icon_url || app.custom_icon ? (
                    <img src={app.custom_icon || app.icon_url} alt={app.name} style={{ width: "32px", height: "32px", borderRadius: "4px" }} />
                  ) : (
                    <div style={{ width: "32px", height: "32px", backgroundColor: "var(--border)", borderRadius: "4px" }} />
                  )}
                  <h3 className="card-title" style={{ margin: 0 }}>{app.name}</h3>
                </div>
                <p className="card-desc">{app.description}</p>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
