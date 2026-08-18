"use client";

import React, { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { Search, ExternalLink, Shield, LogOut, Lock, Server, Layers, Cpu, Radio, Film, Key, Home as HomeIcon, Sparkles } from "lucide-react";

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
    if (app.category && app.category !== 'general') return app.category.toLowerCase();
    const name = app.name.toLowerCase();
    if (name.includes("plex") || name.includes("jellyfin") || name.includes("emby") || name.includes("sonarr") || name.includes("radarr") || name.includes("tv") || name.includes("flix") || name.includes("stream")) return "media";
    if (name.includes("pi-hole") || name.includes("adguard") || name.includes("wireguard") || name.includes("tailscale") || name.includes("pfsense") || name.includes("router") || name.includes("mail")) return "network";
    if (name.includes("proxmox") || name.includes("portainer") || name.includes("docker") || name.includes("grafana") || name.includes("uptime") || name.includes("truenas") || name.includes("docs")) return "system";
    if (name.includes("authentik") || name.includes("vaultwarden") || name.includes("nextcloud") || name.includes("home assistant") || name.includes("homeassistant") || name.includes("ldap") || name.includes("drive") || name.includes("photos") || name.includes("paperless")) return "management";
    return "general";
  };

  const getCategoryBadgeStyle = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "media":
        return { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc", border: "rgba(168, 85, 247, 0.35)", label: "Média" };
      case "network":
        return { bg: "rgba(6, 182, 212, 0.15)", text: "#38bdf8", border: "rgba(6, 182, 212, 0.35)", label: "Hálózat" };
      case "system":
        return { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.35)", label: "Rendszer" };
      case "smarthome":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.35)", label: "Okosotthon" };
      case "security":
        return { bg: "rgba(244, 63, 94, 0.15)", text: "#fb7185", border: "rgba(244, 63, 94, 0.35)", label: "Biztonság" };
      case "storage":
      case "management":
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.35)", label: "Menedzsment" };
      default:
        return { bg: "rgba(148, 163, 184, 0.12)", text: "#cbd5e1", border: "rgba(148, 163, 184, 0.25)", label: "Általános" };
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
          marginBottom: "2.5rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)",
              color: "#090d16",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "1.25rem",
              letterSpacing: "-0.05em",
              boxShadow: "0 4px 12px rgba(255, 255, 255, 0.15)",
            }}
          >
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                HomeHUB
              </h1>
              <span className="tag tag-accent">v2.5</span>
            </div>
            <p style={{ margin: "0.125rem 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Self-Hosted Command Center
            </p>
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
          <div className="flex items-center" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--surface)" }}>
            <button
              onClick={() => setLang("hu")}
              className={`btn btn-sm ${lang === "hu" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: 0, border: "none", padding: "0.25rem 0.625rem" }}
            >
              HU
            </button>
            <button
              onClick={() => setLang("en")}
              className={`btn btn-sm ${lang === "en" ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: 0, border: "none", padding: "0.25rem 0.625rem" }}
            >
              EN
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "100px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem"
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }}></span>
                  <span>{user.name || "User"}</span>
                </span>
                {user.isAdmin && (
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      background: "#ffffff",
                      color: "#090d16",
                      fontWeight: 800,
                      fontSize: "0.6875rem",
                      letterSpacing: "0.04em"
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </div>
              {user.isAdmin && (
                <Link href="/admin" className="btn btn-sm flex items-center gap-1.5">
                  <Shield size={13} />
                  <span>{t("admin_panel")}</span>
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
      <section
        className="flex justify-between items-end flex-wrap gap-4"
        style={{
          marginBottom: "2rem",
          padding: "1.25rem 1.5rem",
          background: "linear-gradient(180deg, rgba(24, 34, 53, 0.4) 0%, rgba(17, 23, 38, 0.2) 100%)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, color: "#ffffff" }}>
            {user ? `${getGreeting()}, ${user.name}` : "HomeHUB Command Center"}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
            {user
              ? `${initialApps.length} ${t("services_count")} a jelenlegi jogosultságaiddal`
              : t("auth_required_desc")}
          </p>
        </div>

        <div className="flex items-center gap-2" style={{ background: "rgba(16, 185, 129, 0.08)", padding: "0.375rem 0.75rem", borderRadius: "100px", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
          <span className="status-dot status-online"></span>
          <span className="font-mono" style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>
            Authentik SSO Védett
          </span>
        </div>
      </section>

      {/* When NOT logged in: Show locked portal view */}
      {!user ? (
        <main>
          <div
            className="card text-center"
            style={{
              padding: "5rem 2rem",
              margin: "1.5rem 0",
              border: "1px dashed #334155",
              background: "linear-gradient(180deg, #111726 0%, #0d121d 100%)",
              gap: "1.5rem",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <Lock size={28} style={{ color: "#38bdf8" }} />
            </div>

            <div style={{ maxWidth: "480px" }}>
              <h3 style={{ fontSize: "1.375rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-0.02em", color: "#ffffff" }}>
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
                style={{ padding: "0.625rem 2rem", fontSize: "0.875rem", fontWeight: 700 }}
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
                  className={`tab-item flex items-center gap-2 ${isActive ? "active" : ""}`}
                >
                  <Icon size={15} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>

          <main>
            {filteredApps.length === 0 ? (
              <div className="card text-center" style={{ padding: "4rem 2rem", margin: "2rem 0", background: "var(--surface)" }}>
                <Server size={36} style={{ color: "var(--text-dim)", margin: "0 auto 1rem auto" }} />
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
                  const cat = getAppCategory(app);
                  const badge = getCategoryBadgeStyle(cat);

                  return (
                    <div
                      key={app.id}
                      className="card group"
                      style={{
                        minHeight: "180px",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Top Row: Icon, Title, Category Badge, Status */}
                      <div>
                        <div className="flex justify-between items-start" style={{ marginBottom: "0.875rem" }}>
                          <div className="flex items-center gap-3.5">
                            {app.custom_icon || app.icon_url ? (
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "var(--radius-sm)",
                                  background: "rgba(15, 20, 32, 0.8)",
                                  border: "1px solid #273549",
                                  padding: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
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
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "var(--radius-sm)",
                                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                                  border: "1px solid #334155",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#ffffff",
                                  fontWeight: 800,
                                  fontSize: "1.125rem",
                                  flexShrink: 0,
                                }}
                              >
                                {app.name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <h3 className="card-title" style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#ffffff" }}>
                                {app.name}
                              </h3>
                              <div style={{ marginTop: "0.25rem" }}>
                                <span
                                  style={{
                                    fontSize: "0.6875rem",
                                    fontWeight: 600,
                                    padding: "0.15rem 0.5rem",
                                    borderRadius: "4px",
                                    background: badge.bg,
                                    color: badge.text,
                                    border: `1px solid ${badge.border}`,
                                    letterSpacing: "0.02em",
                                    display: "inline-block"
                                  }}
                                >
                                  {badge.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1.5"
                            style={{
                              background: "rgba(16, 185, 129, 0.08)",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "100px",
                              border: "1px solid rgba(16, 185, 129, 0.2)"
                            }}
                          >
                            <span className="status-dot status-online"></span>
                            <span className="font-mono" style={{ fontSize: "0.6875rem", color: "#34d399", fontWeight: 600 }}>
                              {t("online")}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="card-desc" style={{ fontSize: "0.8125rem", color: "#94a3b8", lineHeight: 1.5 }}>
                          {app.description || "Self-hosted alkalmazás"}
                        </p>
                      </div>

                      {/* Footer Row: Host Pill & Launch Button */}
                      <div
                        className="flex items-center justify-between gap-2"
                        style={{
                          marginTop: "1.25rem",
                          paddingTop: "0.875rem",
                          borderTop: "1px solid #1e293b",
                        }}
                      >
                        {portOrHost ? (
                          <span
                            className="font-mono"
                            style={{
                              fontSize: "0.6875rem",
                              color: "#64748b",
                              background: "#0d131f",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                              border: "1px solid #1e293b",
                              maxWidth: "160px",
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
                          className="btn btn-sm btn-accent flex items-center gap-1.5"
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
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
      <footer
        className="flex justify-between items-center flex-wrap gap-4"
        style={{
          marginTop: "4rem",
          paddingTop: "1.75rem",
          borderTop: "1px solid var(--border)",
          color: "var(--text-dim)",
          fontSize: "0.75rem",
        }}
      >
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
