"use client";

import React, { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { Search, ExternalLink, Shield, LogOut, Lock, Server, Layers, Cpu, Radio, Film, Key } from "lucide-react";

interface AppItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  custom_icon?: string;
  launch_url?: string;
  category?: string;
  is_visible?: number;
}

interface DashboardClientProps {
  initialApps: AppItem[];
  user: {
    name?: string;
    email?: string;
    isAdmin?: boolean;
    groups?: string[];
  } | null;
}

export default function DashboardClient({ initialApps, user }: DashboardClientProps) {
  const { t, lang, setLang } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Time-based greeting in Hungarian/English
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("welcome");
    if (hour < 18) return t("welcome_afternoon");
    return t("welcome_evening");
  };

  // Helper to extract port or clean domain from launch_url
  const getPortOrHost = (url?: string) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.port) return `Port ${parsed.port}`;
      return parsed.hostname;
    } catch {
      return null;
    }
  };

  // Guess category if not explicitly set
  const getAppCategory = (app: AppItem): string => {
    if (app.category) return app.category.toLowerCase();
    const name = app.name.toLowerCase();
    if (name.includes("plex") || name.includes("jellyfin") || name.includes("emby") || name.includes("sonarr") || name.includes("radarr")) return "media";
    if (name.includes("pi-hole") || name.includes("adguard") || name.includes("wireguard") || name.includes("tailscale") || name.includes("pfsense") || name.includes("router")) return "network";
    if (name.includes("proxmox") || name.includes("portainer") || name.includes("docker") || name.includes("grafana") || name.includes("uptime") || name.includes("truenas")) return "system";
    if (name.includes("authentik") || name.includes("vaultwarden") || name.includes("nextcloud") || name.includes("home assistant") || name.includes("homeassistant")) return "management";
    return "general";
  };

  const categories = [
    { id: "all", label: t("all"), icon: Layers },
    { id: "media", label: t("media"), icon: Film },
    { id: "network", label: t("network"), icon: Radio },
    { id: "system", label: t("system"), icon: Cpu },
    { id: "management", label: t("management"), icon: Server },
  ];

  const filteredApps = initialApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategory === "all") return matchesSearch;
    const cat = getAppCategory(app);
    return matchesSearch && cat === selectedCategory;
  });

  return (
    <div className="container">
      {/* Top Header */}
      <header className="flex justify-between items-center flex-wrap gap-4" style={{ marginBottom: "2.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: "36px",
            height: "36px",
            background: "#ffffff",
            color: "#000000",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1.125rem",
            letterSpacing: "-0.05em"
          }}>
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>HomeHUB</h1>
              <span className="tag">v2.4.0</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-dim)" }}>Homelab Application Portal</p>
          </div>
        </div>

        {/* Search Bar - only active when user is logged in */}
        {user ? (
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="kbd">⌘K</span>
          </div>
        ) : (
          <div style={{ flex: 1 }}></div>
        )}

        {/* Global Controls & User */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            <button
              onClick={() => setLang("hu")}
              className={`btn btn-sm ${lang === "hu" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: 0, border: "none", padding: "0.25rem 0.5rem" }}
            >
              HU
            </button>
            <button
              onClick={() => setLang("en")}
              className={`btn btn-sm ${lang === "en" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: 0, border: "none", padding: "0.25rem 0.5rem" }}
            >
              EN
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="tag" style={{ color: "var(--foreground)" }}>
                  {user.name || "User"}
                </span>
                {user.isAdmin && (
                  <span className="tag" style={{ background: "#ffffff", color: "#000000", fontWeight: 700 }}>
                    ADMIN
                  </span>
                )}
              </div>
              {user.isAdmin && (
                <Link href="/admin" className="btn btn-sm flex items-center gap-1">
                  <Shield size={14} />
                  {t("admin_panel")}
                </Link>
              )}
              <Link href="/api/auth/signout" className="btn btn-sm btn-ghost" title={t("logout")}>
                <LogOut size={14} />
              </Link>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm flex items-center gap-1.5">
              <Key size={13} />
              <span>{t("login")}</span>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Welcome & Stats */}
      <section className="flex justify-between items-end flex-wrap gap-4" style={{ marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
            {user ? `${getGreeting()}, ${user.name}` : "HomeHUB Command Center"}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
            {user ? `${initialApps.length} ${t("services_count")}` : t("auth_required_desc")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="status-dot status-online"></span>
          <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Authentik SSO Guard
          </span>
        </div>
      </section>

      {/* When NOT logged in: Show locked portal view */}
      {!user ? (
        <main>
          <div
            className="card text-center"
            style={{
              padding: "4.5rem 2rem",
              margin: "1.5rem 0",
              border: "1px dashed var(--border)",
              background: "#080808",
              gap: "1.5rem",
              alignItems: "center"
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#141414",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto"
              }}
            >
              <Lock size={26} style={{ color: "var(--text-dim)" }} />
            </div>

            <div style={{ maxWidth: "480px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem 0", letterSpacing: "-0.02em" }}>
                {t("auth_required")}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                {t("auth_required_desc")}
              </p>
            </div>

            <div className="flex gap-3" style={{ marginTop: "0.5rem" }}>
              <Link
                href="/login"
                className="btn btn-primary"
                style={{ padding: "0.625rem 1.75rem", fontSize: "0.875rem", fontWeight: 600 }}
              >
                {t("login")} →
              </Link>
            </div>
          </div>
        </main>
      ) : (
        /* When Logged in: Show Category Tabs & Application Cards */
        <>
          <nav className="tab-list">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`tab-item flex items-center gap-1.5 ${isActive ? "active" : ""}`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>

          <main>
            {filteredApps.length === 0 ? (
              <div className="card text-center" style={{ padding: "4rem 2rem", margin: "2rem 0" }}>
                <Server size={32} style={{ color: "var(--text-dim)", margin: "0 auto 1rem auto" }} />
                <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", margin: 0 }}>
                  {searchQuery ? t("no_apps") : t("no_apps_for_role")}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="btn btn-sm"
                    style={{ alignSelf: "center", marginTop: "1rem" }}
                  >
                    Keresés törlése
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-cards">
                {filteredApps.map((app) => {
                  const portOrHost = getPortOrHost(app.launch_url);
                  return (
                    <div key={app.id} className="card group" style={{ minHeight: "160px" }}>
                      <div className="flex justify-between items-start" style={{ marginBottom: "0.75rem" }}>
                        <div className="flex items-center gap-3">
                          {app.custom_icon || app.icon_url ? (
                            <img
                              src={app.custom_icon || app.icon_url}
                              alt={app.name}
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "var(--radius-sm)",
                                objectFit: "contain",
                                border: "1px solid var(--border)",
                                background: "#111111",
                                padding: "4px"
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "var(--radius-sm)",
                                background: "#141414",
                                border: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--foreground)",
                                fontWeight: 700,
                                fontSize: "0.875rem"
                              }}
                            >
                              {app.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="card-title">{app.name}</h3>
                            <span className="tag" style={{ textTransform: "capitalize", fontSize: "0.625rem" }}>
                              {getAppCategory(app)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5" title="Service online">
                          <span className="status-dot status-online"></span>
                          <span className="font-mono" style={{ fontSize: "0.6875rem", color: "var(--text-dim)" }}>
                            {t("online")}
                          </span>
                        </div>
                      </div>

                      <p className="card-desc" style={{ flex: 1 }}>
                        {app.description || "Self-hosted service"}
                      </p>

                      <div className="flex items-center justify-between" style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid #1a1a1a" }}>
                        {portOrHost ? (
                          <span className="tag">{portOrHost}</span>
                        ) : (
                          <span></span>
                        )}

                        <a
                          href={app.launch_url || "#"}
                          target={app.launch_url ? "_blank" : "_self"}
                          rel="noreferrer"
                          className="btn btn-sm btn-primary flex items-center gap-1"
                        >
                          <span>{t("launch")}</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      {/* Footer */}
      <footer className="flex justify-between items-center flex-wrap gap-4" style={{ marginTop: "4rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", color: "var(--text-dim)", fontSize: "0.75rem" }}>
        <div>© 2026 HomeHUB • Self-Hosted Command Center</div>
        <div className="flex gap-4">
          <Link href="/admin/settings" className="btn-ghost" style={{ fontSize: "0.75rem" }}>
            {t("settings")}
          </Link>
          <Link href="/admin/sync" className="btn-ghost" style={{ fontSize: "0.75rem" }}>
            {t("sync")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
