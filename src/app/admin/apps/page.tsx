"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Eye, EyeOff, Edit, X } from "lucide-react";

export default function AppsPage() {
  const { t } = useI18n();
  const [apps, setApps] = useState<any[]>([]);
  const [editingApp, setEditingApp] = useState<any | null>(null);

  const fetchApps = () => {
    fetch("/api/admin/apps")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setApps(data);
      });
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    await fetch(`/api/admin/apps/${editingApp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingApp),
    });
    
    setEditingApp(null);
    fetchApps();
  };

  return (
    <div>
      <h1 style={{ margin: "0 0 2rem 0", fontSize: "1.875rem" }}>{t("apps")}</h1>
      
      <div className="card" style={{ padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
              <th style={{ padding: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>Név</th>
              <th style={{ padding: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>URL</th>
              <th style={{ padding: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>Forrás</th>
              <th style={{ padding: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>Láthatóság</th>
              <th style={{ padding: "1rem", color: "var(--text-muted)", fontWeight: 500, width: "100px" }}>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  {t("no_apps")}
                </td>
              </tr>
            ) : (
              apps.map(app => (
                <tr key={app.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {app.custom_icon ? (
                       <img src={app.custom_icon} alt={app.name} style={{ width: "24px", height: "24px", borderRadius: "4px" }} />
                    ) : (
                      <div style={{ width: "24px", height: "24px", backgroundColor: "var(--border)", borderRadius: "4px" }} />
                    )}
                    {app.name}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <a href={app.launch_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{app.launch_url}</a>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {app.is_imported ? <span style={{ fontSize: "0.75rem", background: "rgba(59, 130, 246, 0.1)", color: "var(--accent)", padding: "0.2rem 0.5rem", borderRadius: "100px" }}>Authentik</span> : 'Helyi'}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {app.is_visible ? <Eye size={18} color="var(--text-muted)" /> : <EyeOff size={18} color="#ef4444" />}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <button className="btn" style={{ padding: "0.25rem 0.5rem" }} title="Szerkesztés" onClick={() => setEditingApp(app)}>
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingApp && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", position: "relative" }}>
            <button onClick={() => setEditingApp(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--foreground)", cursor: "pointer" }}>
              <X size={20} />
            </button>
            <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Alkalmazás szerkesztése</h2>
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="text-muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Név</label>
                <input className="input" value={editingApp.name || ""} onChange={e => setEditingApp({...editingApp, name: e.target.value})} />
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Leírás</label>
                <input className="input" value={editingApp.description || ""} onChange={e => setEditingApp({...editingApp, description: e.target.value})} />
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Ikon URL (opcionális)</label>
                <input className="input" value={editingApp.custom_icon || ""} onChange={e => setEditingApp({...editingApp, custom_icon: e.target.value})} placeholder="https://..." />
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Launch URL</label>
                <input className="input" value={editingApp.launch_url || ""} onChange={e => setEditingApp({...editingApp, launch_url: e.target.value})} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" checked={editingApp.is_visible ? true : false} onChange={e => setEditingApp({...editingApp, is_visible: e.target.checked})} />
                Megjelenítés a főoldalon
              </label>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>{t("save")}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
