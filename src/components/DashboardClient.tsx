"use client";

import React, { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { Search, ExternalLink, Shield, LogOut, Lock, Server, Layers, Cpu, Radio, Film, Key, RefreshCw } from "lucide-react";

interface AppItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  custom_icon?: string;
  launch_url?: string;
  healthcheck_url?: string;
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
  const [healthMap, setHealthMap] = useState<Record<number, { status: 'online' | 'offline' | 'checking'; latencyMs?: number }>>({});
  const [isHealthRefreshing, setIsHealthRefreshing] = useState(false);
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

  // Health check polling
  const fetchHealth = async () => {
    if (!user || initialApps.length === 0) return;
    setIsHealthRefreshing(true);

    try {
      const res = await fetch('/api/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appIds: initialApps.map((a) => a.id) }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          setHealthMap(data.results);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsHealthRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHealth();
      const interval = setInterval(fetchHealth, 45000); // 45s interval
      return () => clearInterval(interval);
    }
  }, [user, initialApps]);

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
    if (app.category && app.category !== 'general') return app.category.toLowerCase();
    const name = app.name.toLowerCase();
    if (name.includes("plex") || name.includes("jellyfin") || name.includes("emby") || name.includes("sonarr") || name.includes("radarr") || name.includes("tv") || name.includes("flix") || name.includes("stream")) return "media";
    if (name.includes("pi-hole") || name.includes("adguard") || name.includes("wireguard") || name.includes("tailscale") || name.includes("pfsense") || name.includes("router") || name.includes("mail")) return "network";
    if (name.includes("proxmox") || name.includes("portainer") || name.includes("docker") || name.includes("grafana") || name.includes("uptime") || name.includes("truenas") || name.includes("docs")) return "system";
    if (name.includes("authentik") || name.includes("vaultwarden") || name.includes("nextcloud") || name.includes("home assistant") || name.includes("homeassistant") || name.includes("ldap") || name.includes("drive") || name.includes("photos") || name.includes("paperless")) return "management";
    return "general";
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "media": return "Média";
      case "network": return "Hálózat";
      case "system": return "Rendszer";
      case "smarthome": return "Okosotthon";
      case "security": return "Biztonság";
      case "storage": return "Tárhely";
      case "management": return "Menedzsment";
      default: return "Általános";
    }
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
      <header
        className="flex justify-between items-center flex-wrap gap-4"
        style={{
          marginBottom: "1.75rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: "34px",
              height: "34px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "1.125rem",
            }}
          >
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                HomeHUB
              </h1>
              <span className="tag" style={{ fontSize: "0.625rem" }}>v2.5</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-dim)" }}>
              Self-Hosted Command Center
            </p>
          </div>
        </div>

        {/* Search Bar */}
        {user ? (
          <div className="search-wrapper">
            <Search className="search-icon" size={14} />
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
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
            <button
              onClick={() => setLang("hu")}
              className={`btn btn-sm ${lang === "hu" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: 0, border: "none", padding: "0.2rem 0.5rem" }}
            >
              HU
            </button>
            <button
              onClick={() => setLang("en")}
              className={`btn btn-sm ${lang === "en" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: 0, border: "none", padding: "0.2rem 0.5rem" }}
            >
              EN
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <span
                style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--foreground)",
                }}
              >
                {user.name || "User"}
              </span>

              {user.isAdmin && (
                <Link href="/admin" className="btn btn-sm flex items-center gap-1.5">
                  <Shield size={12} />
                  <span style={{ fontSize: "0.75rem" }}>{t("admin_panel")}</span>
                </Link>
              )}
              <Link href="/api/auth/signout" className="btn btn-sm btn-ghost" title={t("logout")}>
                <LogOut size={13} />
              </Link>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm flex items-center gap-1.5">
              <Key size={12} />
              <span>{t("login")}</span>
            </Link>
          )}
        </div>
      </header>

      {/* Sub-header / Status bar */}
      <section
        className="flex justify-between items-center flex-wrap gap-3"
        style={{
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            {user ? `${getGreeting()}, ${user.name}` : "HomeHUB"}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0.125rem 0 0 0" }}>
            {user
              ? `${initialApps.length} ${t("services_count")}`
              : t("auth_required_desc")}
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <button
              onClick={fetchHealth}
              disabled={isHealthRefreshing}
              className="btn btn-sm btn-ghost flex items-center gap-1.5"
              style={{ fontSize: "0.75rem" }}
              title="Elérhetőség frissítése"
            >
              <RefreshCw size={11} className={isHealthRefreshing ? "animate-spin" : ""} />
              <span>Állapot frissítése</span>
            </button>
          </div>
        )}
      </section>

      {/* When NOT logged in: Show locked portal view */}
      {!user ? (
        <main>
          <div
            className="card text-center"
            style={{
              padding: "4rem 1.5rem",
              margin: "1.5rem 0",
              border: "1px dashed var(--border)",
              background: "var(--surface)",
              gap: "1.25rem",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-sm)",
                background: "var(--background)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <Lock size={22} style={{ color: "var(--text-muted)" }} />
            </div>

            <div style={{ maxWidth: "420px" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.375rem 0" }}>
                {t("auth_required")}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", lineHeight: 1.5, margin: 0 }}>
                {t("auth_required_desc")}
              </p>
            </div>

            <div style={{ marginTop: "0.25rem" }}>
              <Link
                href="/login"
                className="btn btn-primary"
                style={{ padding: "0.5rem 1.5rem", fontSize: "0.8125rem", fontWeight: 600 }}
              >
                {t("login")} →
              </Link>
            </div>
          </div>
        </main>
      ) : (
        /* When Logged in: Category Tabs & Service Grid */
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
                  <Icon size={13} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>

          <main>
            {filteredApps.length === 0 ? (
              <div className="card text-center" style={{ padding: "3.5rem 1.5rem", margin: "1.5rem 0" }}>
                <Server size={32} style={{ color: "var(--text-dim)", margin: "0 auto 0.75rem auto" }} />
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
                  {searchQuery ? t("no_apps") : t("no_apps_for_role")}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="btn btn-sm"
                    style={{ alignSelf: "center", marginTop: "0.75rem" }}
                  >
                    Keresés törlése
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-cards">
                {filteredApps.map((app) => {
                  const portOrHost = getPortOrHost(app.launch_url);
                  const cat = getAppCategory(app);
                  const catLabel = getCategoryLabel(cat);
                  const health = healthMap[app.id];

                  return (
                    <div
                      key={app.id}
                      className="card"
                      style={{
                        minHeight: "155px",
                        justifyContent: "space-between",
                        gap: "0.875rem",
                      }}
                    >
                      {/* Top Row: Icon + (Title & Category) + Health Badge */}
                      <div>
                        <div className="flex justify-between items-start gap-2" style={{ marginBottom: "0.625rem" }}>
                          <div className="flex items-center gap-3">
                            {/* App Icon */}
                            {app.custom_icon || app.icon_url ? (
                              <div
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "var(--radius-sm)",
                                  background: "var(--background)",
                                  border: "1px solid var(--border)",
                                  padding: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <img
                                  src={app.custom_icon || app.icon_url}
                                  alt={app.name}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                  }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "var(--radius-sm)",
                                  background: "var(--background)",
                                  border: "1px solid var(--border)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "var(--foreground)",
                                  fontWeight: 700,
                                  fontSize: "0.9375rem",
                                  flexShrink: 0,
                                }}
                              >
                                {app.name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            {/* Name & Category Tag cleanly separated */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              <h3 className="card-title">
                                {app.name}
                              </h3>
                              <div>
                                <span className="tag" style={{ fontSize: "0.625rem", padding: "0.075rem 0.35rem" }}>
                                  {catLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Live Health Status Badge (Clean Flat Pill) */}
                          {health ? (
                            health.status === 'online' ? (
                              <div
                                className="flex items-center gap-1.5 font-mono"
                                title={health.latencyMs ? `Válaszidő: ${health.latencyMs}ms` : "Szolgáltatás elérhető"}
                                style={{
                                  background: "#111b15",
                                  color: "#3fb950",
                                  border: "1px solid #238636",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "100px",
                                  fontSize: "0.6875rem",
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                <span className="status-dot status-online"></span>
                                <span>{health.latencyMs ? `${health.latencyMs}ms` : t("online")}</span>
                              </div>
                            ) : (
                              <div
                                className="flex items-center gap-1.5 font-mono"
                                title="A szolgáltatás nem elérhető"
                                style={{
                                  background: "#201314",
                                  color: "#f85149",
                                  border: "1px solid #da3633",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "100px",
                                  fontSize: "0.6875rem",
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                <span className="status-dot status-error"></span>
                                <span>Offline</span>
                              </div>
                            )
                          ) : (
                            <div
                              className="flex items-center gap-1.5 font-mono"
                              style={{
                                background: "#1c180e",
                                color: "#d29922",
                                border: "1px solid #9e6a03",
                                padding: "0.15rem 0.45rem",
                                borderRadius: "100px",
                                fontSize: "0.6875rem",
                                fontWeight: 500,
                                flexShrink: 0,
                              }}
                            >
                              <span className="status-dot status-standby"></span>
                              <span>...</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="card-desc">
                          {app.description || "Self-hosted szolgáltatás"}
                        </p>
                      </div>

                      {/* Footer: Host domain + Megnyitás button */}
                      <div
                        className="flex items-center justify-between gap-2"
                        style={{
                          paddingTop: "0.625rem",
                          borderTop: "1px solid var(--border-muted)",
                        }}
                      >
                        {portOrHost ? (
                          <span
                            className="font-mono text-dim"
                            style={{
                              fontSize: "0.6875rem",
                              maxWidth: "150px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {portOrHost}
                          </span>
                        ) : (
                          <span></span>
                        )}

                        <a
                          href={app.launch_url || "#"}
                          target={app.launch_url ? "_blank" : "_self"}
                          rel="noreferrer"
                          className="btn btn-sm btn-action flex items-center gap-1"
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.625rem",
                          }}
                        >
                          <span>{t("launch")}</span>
                          <ExternalLink size={11} />
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
      <footer
        className="flex justify-between items-center flex-wrap gap-4"
        style={{
          marginTop: "3.5rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid var(--border)",
          color: "var(--text-dim)",
          fontSize: "0.75rem",
        }}
      >
        <div>© 2026 HomeHUB • Self-Hosted Command Center</div>
        {user?.isAdmin && (
          <div className="flex gap-3">
            <Link href="/admin/settings" className="btn-ghost" style={{ fontSize: "0.75rem" }}>
              {t("settings")}
            </Link>
            <Link href="/admin/sync" className="btn-ghost" style={{ fontSize: "0.75rem" }}>
              {t("sync")}
            </Link>
          </div>
        )}
      </footer>
    </div>
  );
}
