"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { RefreshCw } from "lucide-react";

export default function SyncPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        setMessage(data.message || t("success"));
      } else {
        setMessage(data.error || t("error"));
      }
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ margin: "0 0 2rem 0", fontSize: "1.875rem" }}>{t("sync_authentik")}</h1>
      
      <div className="card" style={{ maxWidth: "600px" }}>
        <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
          Az alkalmazások és csoportok szinkronizálása az Authentik kiszolgálóról. 
          Győződj meg róla, hogy a beállításoknál megadtad a helyes API URL-t és Tokent.
        </p>

        <button 
          onClick={handleSync} 
          disabled={loading}
          className="btn btn-primary flex items-center gap-2"
          style={{ alignSelf: "flex-start", width: "fit-content" }}
        >
          <RefreshCw size={18} className={loading ? "spin" : ""} />
          {loading ? "Szinkronizálás..." : "Szinkronizálás Indítása"}
        </button>

        {message && (
          <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "var(--radius)", backgroundColor: message.includes("hiba") || message.includes("error") ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", border: `1px solid ${message.includes("hiba") || message.includes("error") ? "#ef4444" : "#22c55e"}`, color: message.includes("hiba") || message.includes("error") ? "#ef4444" : "#22c55e" }}>
            {message}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
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
