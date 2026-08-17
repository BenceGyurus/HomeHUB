"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { RefreshCw, CheckCircle2, AlertCircle, Server, Users, Layers } from "lucide-react";
import Link from "next/link";

export default function SyncPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { error: rawText || `Szerver válasz: HTTP ${res.status}` };
      }

      if (res.ok && data.success) {
        setResult({
          message: data.message || "Az alkalmazások és csoportok sikeresen szinkronizálva!",
          success: true,
        });
      } else {
        setResult({
          message: data.error || `Hiba: HTTP ${res.status}`,
          success: false,
        });
      }
    } catch (e: any) {
      setResult({
        message: e.message || "Hálózati kapcsolati hiba.",
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            {t("sync_authentik")}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", margin: "0.25rem 0 0 0" }}>
            Alkalmazás definíciók és felhasználói csoportok lekérése az Authentik API-ból
          </p>
        </div>
      </div>

      {/* Sync Control Card */}
      <div className="card" style={{ maxWidth: "680px", gap: "1.25rem" }}>
        <div>
          <h3 className="card-title" style={{ fontSize: "1.0625rem" }}>
            Szinkronizálási folyamat
          </h3>
          <p className="card-desc" style={{ marginTop: "0.5rem" }}>
            A szinkronizálás automatikusan beimportálja az Authentikben regisztrált alkalmazásokat (név, slug, ikon és launch URL adatokkal), valamint a csoportokat. A meglévő egyéni beállításaid megmaradnak.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div style={{ padding: "0.875rem", background: "#111111", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 text-dim" style={{ marginBottom: "0.375rem" }}>
              <Layers size={14} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Alkalmazások</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              API végpont: <code>/api/v3/core/applications/</code>
            </p>
          </div>

          <div style={{ padding: "0.875rem", background: "#111111", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 text-dim" style={{ marginBottom: "0.375rem" }}>
              <Users size={14} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Csoportok</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              API végpont: <code>/api/v3/core/groups/</code>
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={handleSync}
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>{loading ? "Szinkronizálás folyamatban..." : "Szinkronizálás indítása most"}</span>
          </button>
        </div>

        {result && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              background: result.success ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
              border: `1px solid ${result.success ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              color: result.success ? "var(--status-online)" : "var(--status-error)",
            }}
          >
            {result.success ? <CheckCircle2 size={18} style={{ marginTop: "2px" }} /> : <AlertCircle size={18} style={{ marginTop: "2px" }} />}
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                {result.success ? "Sikeres szinkronizáció" : "Szinkronizációs hiba"}
              </div>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8125rem", color: result.success ? "#a7f3d0" : "#fca5a5" }}>
                {result.message}
              </p>
              {result.success && (
                <div className="flex gap-3" style={{ marginTop: "0.75rem" }}>
                  <Link href="/admin/apps" className="btn btn-sm btn-ghost" style={{ padding: 0, textDecoration: "underline", fontSize: "0.75rem" }}>
                    Alkalmazások megtekintése →
                  </Link>
                  <Link href="/admin/groups" className="btn btn-sm btn-ghost" style={{ padding: 0, textDecoration: "underline", fontSize: "0.75rem" }}>
                    Csoportok kezelése →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
}
