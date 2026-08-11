"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<Record<string, string>>({
    authentik_api_url: "",
    authentik_api_token: "",
    authentik_client_id: "",
    authentik_client_secret: "",
    authentik_issuer: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    
    if (res.ok) {
      setMessage(t("success"));
    } else {
      setMessage(t("error"));
    }
  };

  return (
    <div>
      <h1 style={{ margin: "0 0 2rem 0", fontSize: "1.875rem" }}>{t("authentik_settings")}</h1>
      
      <div className="card" style={{ maxWidth: "600px" }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="text-muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>{t("api_url")}</label>
            <input 
              type="text" 
              name="authentik_api_url"
              className="input" 
              value={settings.authentik_api_url || ""} 
              onChange={handleChange} 
              placeholder="https://auth.gyurus.hu"
            />
          </div>
          <div>
            <label className="text-muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>{t("api_token")}</label>
            <input 
              type="password" 
              name="authentik_api_token"
              className="input" 
              value={settings.authentik_api_token || ""} 
              onChange={handleChange} 
            />
          </div>

          <hr style={{ border: "0", borderTop: "1px solid var(--border)", margin: "1rem 0" }} />

          <div>
            <label className="text-muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>{t("client_id")}</label>
            <input 
              type="text" 
              name="authentik_client_id"
              className="input" 
              value={settings.authentik_client_id || ""} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <label className="text-muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>{t("client_secret")}</label>
            <input 
              type="password" 
              name="authentik_client_secret"
              className="input" 
              value={settings.authentik_client_secret || ""} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <label className="text-muted" style={{ fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>{t("issuer")}</label>
            <input 
              type="text" 
              name="authentik_issuer"
              className="input" 
              value={settings.authentik_issuer || ""} 
              onChange={handleChange} 
              placeholder="https://auth.gyurus.hu/application/o/homehub/"
            />
          </div>
          
          {message && <p style={{ fontSize: "0.875rem", color: message === t("success") ? "#22c55e" : "#ef4444" }}>{message}</p>}
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", alignSelf: "flex-start" }}>
            {t("save")}
          </button>
        </form>
      </div>
    </div>
  );
}
