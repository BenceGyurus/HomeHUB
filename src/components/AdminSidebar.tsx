"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { LayoutGrid, AppWindow, Users, RefreshCw, Settings, Home, ArrowLeft } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: "/admin", label: t("overview"), icon: LayoutGrid },
    { href: "/admin/apps", label: t("apps"), icon: AppWindow },
    { href: "/admin/groups", label: t("groups"), icon: Users },
    { href: "/admin/sync", label: t("sync"), icon: RefreshCw },
    { href: "/admin/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <aside className="admin-sidebar">
      {/* Header */}
      <div className="flex items-center gap-3" style={{ padding: "0.25rem 0.5rem" }}>
        <div style={{
          width: "28px",
          height: "28px",
          background: "#ffffff",
          color: "#000000",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "0.9375rem"
        }}>
          H
        </div>
        <div>
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--foreground)" }}>HomeHUB</div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>Control Center</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Return */}
      <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        <Link href="/" className="btn btn-sm btn-ghost flex items-center gap-2" style={{ width: "100%", justifyContent: "flex-start" }}>
          <ArrowLeft size={14} />
          <span>{t("back_to_dashboard")}</span>
        </Link>
      </div>
    </aside>
  );
}
