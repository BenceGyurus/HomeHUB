import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, LayoutGrid, Users, RefreshCw, Home } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(getAuthOptions());
  
  if (!session?.user || !(session.user as any).isAdmin) {
    redirect("/login");
  }

  return (
    <div className="flex" style={{ minHeight: "100vh" }}>
      <aside style={{ width: "250px", borderRight: "1px solid var(--border)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", margin: "0 0 1rem 0" }}>Admin Panel</h2>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link href="/admin" className="flex items-center gap-2" style={{ padding: "0.5rem", borderRadius: "var(--radius)", color: "var(--text-muted)", textDecoration: "none" }}>
            <LayoutGrid size={18} /> Áttekintés
          </Link>
          <Link href="/admin/apps" className="flex items-center gap-2" style={{ padding: "0.5rem", borderRadius: "var(--radius)", color: "var(--text-muted)", textDecoration: "none" }}>
            <LayoutGrid size={18} /> Alkalmazások
          </Link>
          <Link href="/admin/groups" className="flex items-center gap-2" style={{ padding: "0.5rem", borderRadius: "var(--radius)", color: "var(--text-muted)", textDecoration: "none" }}>
            <Users size={18} /> Csoportok
          </Link>
          <Link href="/admin/sync" className="flex items-center gap-2" style={{ padding: "0.5rem", borderRadius: "var(--radius)", color: "var(--text-muted)", textDecoration: "none" }}>
            <RefreshCw size={18} /> Szinkronizálás
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-2" style={{ padding: "0.5rem", borderRadius: "var(--radius)", color: "var(--text-muted)", textDecoration: "none" }}>
            <Settings size={18} /> Beállítások
          </Link>
        </nav>

        <div style={{ marginTop: "auto" }}>
          <Link href="/" className="flex items-center gap-2 btn">
            <Home size={18} /> Vissza a Főoldalra
          </Link>
        </div>
      </aside>
      
      <main style={{ flex: 1, padding: "2rem" }}>
        {children}
      </main>
    </div>
  );
}
