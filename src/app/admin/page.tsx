import db from "@/lib/db";
import Link from "next/link";
import { AppWindow, Users, RefreshCw, Settings, ShieldCheck, ArrowRight, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const appsCount = (db.prepare('SELECT count(*) as count FROM apps').get() as any)?.count || 0;
  const visibleAppsCount = (db.prepare('SELECT count(*) as count FROM apps WHERE is_visible = 1').get() as any)?.count || 0;
  const groupsCount = (db.prepare('SELECT count(*) as count FROM groups').get() as any)?.count || 0;
  const assignedMappingsCount = (db.prepare('SELECT count(*) as count FROM app_groups').get() as any)?.count || 0;
  
  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as Record<string, string>);
  const hasAuthentikApi = Boolean(settings.authentik_api_url && settings.authentik_api_token);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            Rendszer Áttekintés
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", margin: "0.25rem 0 0 0" }}>
            HomeHUB Adminisztrációs és Szolgáltatáskezelő Központ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/sync" className="btn btn-sm btn-primary flex items-center gap-1.5">
            <RefreshCw size={14} />
            <span>Szinkronizálás indítása</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="card">
          <div className="flex justify-between items-center text-dim" style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Alkalmazások
            </span>
            <AppWindow size={16} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em" }}>{appsCount}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
            {visibleAppsCount} publikusan látható
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center text-dim" style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Csoportok
            </span>
            <Users size={16} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em" }}>{groupsCount}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
            Authentik szinkronizált csoport
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center text-dim" style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Jogosultságok
            </span>
            <ShieldCheck size={16} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em" }}>{assignedMappingsCount}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
            Aktív csoport-app hozzárendelés
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center text-dim" style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Authentik API
            </span>
            <Activity size={16} />
          </div>
          <div className="flex items-center gap-2" style={{ marginTop: "0.25rem" }}>
            <span className={`status-dot ${hasAuthentikApi ? "status-online" : "status-error"}`}></span>
            <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>
              {hasAuthentikApi ? "Konfigurálva" : "Hiányos"}
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
            {hasAuthentikApi ? "API token és URL beállítva" : "Add meg a beállításokban"}
          </div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        <div className="card" style={{ gap: "1rem" }}>
          <div>
            <h3 className="card-title">Alkalmazások kezelése</h3>
            <p className="card-desc">Szerkeszd az alkalmazások neveit, URL címeit, egyedi ikonjait és láthatóságát.</p>
          </div>
          <div style={{ marginTop: "auto" }}>
            <Link href="/admin/apps" className="btn btn-sm flex items-center justify-between" style={{ width: "100%" }}>
              <span>Alkalmazás lista megnyitása</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="card" style={{ gap: "1rem" }}>
          <div>
            <h3 className="card-title">Csoport & Jogosultság Mátrix</h3>
            <p className="card-desc">Állítsd be, hogy melyik Authentik csoport tagjai melyik alkalmazást érhetik el a felületen.</p>
          </div>
          <div style={{ marginTop: "auto" }}>
            <Link href="/admin/groups" className="btn btn-sm flex items-center justify-between" style={{ width: "100%" }}>
              <span>Jogosultsági mátrix beállítása</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="card" style={{ gap: "1rem" }}>
          <div>
            <h3 className="card-title">Authentik és Rendszerbeállítások</h3>
            <p className="card-desc">Konfiguráld az Authentik API Tokent, SSO Client ID/Secret adatokat és egyéb rendszerbeállításokat.</p>
          </div>
          <div style={{ marginTop: "auto" }}>
            <Link href="/admin/settings" className="btn btn-sm flex items-center justify-between" style={{ width: "100%" }}>
              <span>Beállítások megnyitása</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
