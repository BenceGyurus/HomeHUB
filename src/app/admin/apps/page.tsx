"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Eye, EyeOff, Edit, X, Plus, ExternalLink, Search, Sparkles, Image as ImageIcon } from "lucide-react";
import IconPickerModal from "@/components/IconPickerModal";
import { findMatchingIcon } from "@/lib/icons";

export default function AppsPage() {
  const { t } = useI18n();
  const [apps, setApps] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [editingApp, setEditingApp] = useState<any | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<"new" | "edit">("new");

  const [newApp, setNewApp] = useState({
    name: "",
    slug: "",
    description: "",
    launch_url: "",
    custom_icon: "",
    category: "general",
    is_visible: true,
  });

  const fetchApps = () => {
    fetch("/api/admin/apps")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setApps(data);
      });
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleNameChange = (name: string, target: "new" | "edit") => {
    const matching = findMatchingIcon(name);
    if (target === "new") {
      setNewApp((prev) => ({
        ...prev,
        name,
        // Auto suggest icon if not already set
        custom_icon: prev.custom_icon ? prev.custom_icon : (matching ? matching.url : ""),
        category: prev.category === "general" && matching ? matching.category : prev.category,
      }));
    } else if (editingApp) {
      setEditingApp((prev: any) => ({
        ...prev,
        name,
        custom_icon: prev.custom_icon ? prev.custom_icon : (matching ? matching.url : ""),
      }));
    }
  };

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

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newApp.slug || newApp.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    await fetch("/api/admin/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newApp, slug }),
    });

    setIsAddingNew(false);
    setNewApp({
      name: "",
      slug: "",
      description: "",
      launch_url: "",
      custom_icon: "",
      category: "general",
      is_visible: true,
    });
    fetchApps();
  };

  const toggleVisibility = async (app: any) => {
    const updated = { ...app, is_visible: !app.is_visible };
    await fetch(`/api/admin/apps/${app.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    fetchApps();
  };

  const openIconPicker = (target: "new" | "edit") => {
    setIconPickerTarget(target);
    setIsIconPickerOpen(true);
  };

  const handleIconSelected = (iconUrl: string) => {
    if (iconPickerTarget === "new") {
      setNewApp((prev) => ({ ...prev, custom_icon: iconUrl }));
    } else if (editingApp) {
      setEditingApp((prev: any) => ({ ...prev, custom_icon: iconUrl }));
    }
  };

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            {t("apps")}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", margin: "0.25rem 0 0 0" }}>
            Szolgáltatások konfigurálása, homelab ikonok és láthatóság kezelése
          </p>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="btn btn-primary flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Új alkalmazás</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="search-wrapper" style={{ maxWidth: "300px" }}>
          <Search className="search-icon" size={14} />
          <input
            type="text"
            className="search-input"
            placeholder="Szűrés név alapján..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
        <span className="font-mono text-dim" style={{ fontSize: "0.75rem" }}>
          {filteredApps.length} / {apps.length} alkalmazás
        </span>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Alkalmazás</th>
              <th>Kategória</th>
              <th>Launch URL</th>
              <th>Forrás</th>
              <th>Láthatóság</th>
              <th className="text-right">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                  {t("no_apps")}
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {app.custom_icon || app.icon_url ? (
                        <img
                          src={app.custom_icon || app.icon_url}
                          alt={app.name}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "var(--radius-sm)",
                            objectFit: "contain",
                            border: "1px solid var(--border)",
                            background: "#111111",
                            padding: "2px",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "#171717",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          {app.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{app.name}</div>
                        {app.description && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {app.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="tag" style={{ textTransform: "capitalize" }}>
                      {app.category || "general"}
                    </span>
                  </td>

                  <td>
                    {app.launch_url ? (
                      <a
                        href={app.launch_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-mono"
                        style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}
                      >
                        <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {app.launch_url}
                        </span>
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-dim">—</span>
                    )}
                  </td>

                  <td>
                    {app.is_imported ? (
                      <span className="tag tag-accent">Authentik</span>
                    ) : (
                      <span className="tag">Helyi</span>
                    )}
                  </td>

                  <td>
                    <button
                      onClick={() => toggleVisibility(app)}
                      className={`btn btn-sm ${app.is_visible ? "btn-ghost" : "btn-danger"}`}
                      style={{ padding: "0.25rem 0.5rem" }}
                      title={app.is_visible ? "Kattints az elrejtéshez" : "Kattints a megjelenítéshez"}
                    >
                      {app.is_visible ? (
                        <div className="flex items-center gap-1">
                          <Eye size={14} style={{ color: "var(--status-online)" }} />
                          <span style={{ fontSize: "0.75rem", color: "var(--status-online)" }}>Látható</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <EyeOff size={14} />
                          <span style={{ fontSize: "0.75rem" }}>Rejtett</span>
                        </div>
                      )}
                    </button>
                  </td>

                  <td className="text-right">
                    <button
                      className="btn btn-sm"
                      title="Szerkesztés"
                      onClick={() => setEditingApp(app)}
                    >
                      <Edit size={12} />
                      <span>Szerkesztés</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingApp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center" style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
                {t("edit_app")}
              </h2>
              <button
                onClick={() => setEditingApp(null)}
                className="btn btn-sm btn-ghost"
                style={{ padding: "0.25rem" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                  Alkalmazás Neve *
                </label>
                <input
                  className="input"
                  value={editingApp.name || ""}
                  onChange={(e) => handleNameChange(e.target.value, "edit")}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                  Leírás
                </label>
                <input
                  className="input"
                  value={editingApp.description || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, description: e.target.value })}
                />
              </div>

              {/* Icon Selection Card */}
              <div style={{ padding: "0.875rem", background: "#111111", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  Alkalmazás Ikonja
                </label>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {editingApp.custom_icon || editingApp.icon_url ? (
                      <img
                        src={editingApp.custom_icon || editingApp.icon_url}
                        alt="Ikon"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "var(--radius-sm)",
                          objectFit: "contain",
                          background: "#171717",
                          border: "1px solid var(--border)",
                          padding: "3px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "var(--radius-sm)",
                          background: "#171717",
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-dim)",
                        }}
                      >
                        <ImageIcon size={18} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                        {editingApp.custom_icon ? "Homelab / Egyedi Ikon kiválasztva" : "Nincs egyedi ikon beállítva"}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-dim)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {editingApp.custom_icon || "Alapértelmezett kezdőbetű látható"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openIconPicker("edit")}
                    className="btn btn-sm btn-primary flex items-center gap-1.5"
                  >
                    <Sparkles size={13} />
                    <span>Ikon választása</span>
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                    Kategória
                  </label>
                  <select
                    className="input"
                    value={editingApp.category || "general"}
                    onChange={(e) => setEditingApp({ ...editingApp, category: e.target.value })}
                  >
                    <option value="general">Általános</option>
                    <option value="media">Média</option>
                    <option value="network">Hálózat & DNS</option>
                    <option value="system">Rendszer & VM</option>
                    <option value="smarthome">Okosotthon</option>
                    <option value="security">Biztonság & Auth</option>
                    <option value="storage">Tárhely & Cloud</option>
                    <option value="download">Letöltések</option>
                    <option value="tools">Eszközök</option>
                    <option value="dev">Fejlesztés</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                    Launch URL
                  </label>
                  <input
                    className="input"
                    value={editingApp.launch_url || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, launch_url: e.target.value })}
                    placeholder="https://plex.gyurus.hu"
                  />
                </div>
              </div>

              <div style={{ paddingTop: "0.5rem" }}>
                <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editingApp.is_visible ? true : false}
                    onChange={(e) => setEditingApp({ ...editingApp, is_visible: e.target.checked })}
                    style={{ accentColor: "#ffffff" }}
                  />
                  <span style={{ fontSize: "0.8125rem" }}>Megjelenítés a főoldali dashboardon</span>
                </label>
              </div>

              <div className="flex justify-end gap-2" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="btn btn-ghost btn-sm"
                >
                  Mégse
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Modal */}
      {isAddingNew && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center" style={{ marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
                Új alkalmazás hozzáadása
              </h2>
              <button
                onClick={() => setIsAddingNew(false)}
                className="btn btn-sm btn-ghost"
                style={{ padding: "0.25rem" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateApp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                  Alkalmazás Neve *
                </label>
                <input
                  className="input"
                  value={newApp.name}
                  onChange={(e) => handleNameChange(e.target.value, "new")}
                  placeholder="pl. Plex, Proxmox, Pi-hole..."
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                  Leírás
                </label>
                <input
                  className="input"
                  value={newApp.description}
                  onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                  placeholder="pl. Média szerver, DNS szűrő..."
                />
              </div>

              {/* Icon Selection Card */}
              <div style={{ padding: "0.875rem", background: "#111111", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  Alkalmazás Ikonja
                </label>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {newApp.custom_icon ? (
                      <img
                        src={newApp.custom_icon}
                        alt="Ikon"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "var(--radius-sm)",
                          objectFit: "contain",
                          background: "#171717",
                          border: "1px solid var(--border)",
                          padding: "3px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "var(--radius-sm)",
                          background: "#171717",
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-dim)",
                        }}
                      >
                        <ImageIcon size={18} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                        {newApp.custom_icon ? "Ikon kiválasztva (Automatikus / Könyvtár)" : "Válassz ikont vagy gépeld be a nevet"}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-dim)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {newApp.custom_icon || "Nincs beállítva"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openIconPicker("new")}
                    className="btn btn-sm btn-primary flex items-center gap-1.5"
                  >
                    <Sparkles size={13} />
                    <span>Ikon választása</span>
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                    Kategória
                  </label>
                  <select
                    className="input"
                    value={newApp.category}
                    onChange={(e) => setNewApp({ ...newApp, category: e.target.value })}
                  >
                    <option value="general">Általános</option>
                    <option value="media">Média</option>
                    <option value="network">Hálózat & DNS</option>
                    <option value="system">Rendszer & VM</option>
                    <option value="smarthome">Okosotthon</option>
                    <option value="security">Biztonság & Auth</option>
                    <option value="storage">Tárhely & Cloud</option>
                    <option value="download">Letöltések</option>
                    <option value="tools">Eszközök</option>
                    <option value="dev">Fejlesztés</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                    Launch URL
                  </label>
                  <input
                    className="input"
                    value={newApp.launch_url}
                    onChange={(e) => setNewApp({ ...newApp, launch_url: e.target.value })}
                    placeholder="https://pve.gyurus.hu:8006"
                  />
                </div>
              </div>

              <div style={{ paddingTop: "0.5rem" }}>
                <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={newApp.is_visible}
                    onChange={(e) => setNewApp({ ...newApp, is_visible: e.target.checked })}
                    style={{ accentColor: "#ffffff" }}
                  />
                  <span style={{ fontSize: "0.8125rem" }}>Megjelenítés a főoldali dashboardon</span>
                </label>
              </div>

              <div className="flex justify-end gap-2" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Mégse
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Létrehozás
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Icon Picker Modal */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelectIcon={handleIconSelected}
        currentIcon={iconPickerTarget === "new" ? newApp.custom_icon : (editingApp?.custom_icon || "")}
        appName={iconPickerTarget === "new" ? newApp.name : (editingApp?.name || "")}
      />
    </div>
  );
}
