"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Shield, Key, Globe, CheckCircle2, AlertCircle, Save, RefreshCw, Copy, Check, Info, Lock } from "lucide-react";

export default function SettingsPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<Record<string, string>>({
    authentik_api_url: "",
    authentik_api_token: "",
    authentik_client_id: "",
    authentik_client_secret: "",
    authentik_issuer: "",
    site_title: "HomeHUB",
  });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [testResult, setTestResult] = useState<{ text: string; success: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState("");

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentOrigin(window.location.origin);
    }

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      });
  }, []);

  const callbackUrl = currentOrigin ? `${currentOrigin}/api/auth/callback/authentik` : "http://<YOUR_IP_OR_DOMAIN>:3000/api/auth/callback/authentik";

  const handleCopyCallback = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ text: t("success"), type: "success" });
      } else {
        setMessage({ text: t("error"), type: "error" });
      }
    } catch {
      setMessage({ text: t("error"), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: settings.authentik_api_url,
          token: settings.authentik_api_token,
        }),
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { error: rawText || `Szerver válasz: HTTP ${res.status}` };
      }

      if (res.ok && data.success) {
        setTestResult({ text: data.message || "Sikeres kapcsolat az Authentik API-val!", success: true });
      } else {
        setTestResult({ text: `Hiba: ${data.error || `HTTP ${res.status} ${res.statusText}`}`, success: false });
      }
    } catch (e: any) {
      setTestResult({ text: `Hiba: ${e.message}`, success: false });
    } finally {
      setTestLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: "Az új jelszavak nem egyeznek meg!", type: "error" });
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMessage({ text: data.message || "A jelszó sikeresen megváltozott!", type: "success" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordMessage({ text: data.error || "Nem sikerült megváltoztatni a jelszót.", type: "error" });
      }
    } catch (e: any) {
      setPasswordMessage({ text: `Hiba: ${e.message}`, type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            {t("settings")}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", margin: "0.25rem 0 0 0" }}>
            Authentik SSO, API integráció és helyi felhasználói beállítások
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary flex items-center gap-1.5"
        >
          <Save size={14} />
          <span>{loading ? "Mentés..." : t("save")}</span>
        </button>
      </div>

      {message && (
        <div
          className="card"
          style={{
            padding: "0.75rem 1rem",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.5rem",
            borderColor: message.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
            backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
            color: message.type === "success" ? "var(--status-online)" : "var(--status-error)",
          }}
        >
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Section 1: Authentik REST API */}
        <div className="card" style={{ gap: "1.25rem" }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Key size={18} style={{ color: "var(--text-muted)" }} />
              <div>
                <h3 className="card-title">Authentik REST API Integráció</h3>
                <p className="card-desc">Alkalmazások és csoportok automatikus szinkronizálásához szükséges API hozzáférés.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testLoading}
              className="btn btn-sm flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={testLoading ? "animate-spin" : ""} />
              <span>{testLoading ? "Tesztelés..." : t("test_connection")}</span>
            </button>
          </div>

          {testResult && (
            <div
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                background: testResult.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                color: testResult.success ? "var(--status-online)" : "var(--status-error)",
                border: `1px solid ${testResult.success ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
              }}
            >
              {testResult.text}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                {t("api_url")}
              </label>
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
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                {t("api_token")} (Bearer Token)
              </label>
              <input
                type="password"
                name="authentik_api_token"
                className="input"
                value={settings.authentik_api_token || ""}
                onChange={handleChange}
                placeholder="••••••••••••••••"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Authentik OIDC Single Sign-On */}
        <div className="card" style={{ gap: "1.25rem" }}>
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: "var(--text-muted)" }} />
            <div>
              <h3 className="card-title">Authentik OpenID Connect (SSO)</h3>
              <p className="card-desc">Felhasználói egygombos bejelentkezés és csoporttagság-átvétel OIDC protokollon keresztül.</p>
            </div>
          </div>

          {/* Callback URL helper box */}
          <div style={{ padding: "0.875rem", background: "#111111", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Info size={14} style={{ color: "var(--text-dim)" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
                  Authentik Providerben kötelező Redirect URI (Callback):
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCallback}
                className="btn btn-sm flex items-center gap-1.5"
                style={{ fontSize: "0.6875rem", padding: "0.25rem 0.5rem" }}
              >
                {copied ? <Check size={12} style={{ color: "var(--status-online)" }} /> : <Copy size={12} />}
                <span>{copied ? "Másolva!" : "Másolás"}</span>
              </button>
            </div>
            <code style={{ display: "block", marginTop: "0.5rem", fontSize: "0.75rem", color: "#38bdf8", wordBreak: "break-all" }}>
              {callbackUrl}
            </code>
            <p style={{ margin: "0.375rem 0 0 0", fontSize: "0.6875rem", color: "var(--text-dim)" }}>
              Add hozzá ezt a pontos URL-t az Authentikben: <em>Applications → Providers → [A te Providered] → Redirect URIs / Origin URLs</em> mezőbe!
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                {t("client_id")}
              </label>
              <input
                type="text"
                name="authentik_client_id"
                className="input"
                value={settings.authentik_client_id || ""}
                onChange={handleChange}
                placeholder="homehub-client-id"
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                {t("client_secret")}
              </label>
              <input
                type="password"
                name="authentik_client_secret"
                className="input"
                value={settings.authentik_client_secret || ""}
                onChange={handleChange}
                placeholder="••••••••••••••••"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                {t("issuer")} (Issuer Provider URL)
              </label>
              <input
                type="text"
                name="authentik_issuer"
                className="input"
                value={settings.authentik_issuer || ""}
                onChange={handleChange}
                placeholder="https://auth.gyurus.hu/application/o/homehub/"
              />
            </div>
          </div>
        </div>

        {/* Section 3: General System Settings */}
        <div className="card" style={{ gap: "1.25rem" }}>
          <div className="flex items-center gap-2">
            <Globe size={18} style={{ color: "var(--text-muted)" }} />
            <div>
              <h3 className="card-title">Portál Alapbeállítások</h3>
              <p className="card-desc">Főoldali cím és általános megjelenítési opciók.</p>
            </div>
          </div>

          <div style={{ maxWidth: "400px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
              Portál Neve
            </label>
            <input
              type="text"
              name="site_title"
              className="input"
              value={settings.site_title || "HomeHUB"}
              onChange={handleChange}
            />
          </div>
        </div>
      </form>

      {/* Section 4: Local Admin Password Change */}
      <div className="card" style={{ gap: "1.25rem" }}>
        <div className="flex items-center gap-2">
          <Lock size={18} style={{ color: "var(--text-muted)" }} />
          <div>
            <h3 className="card-title">Lokális Felhasználó Jelszómódosítása</h3>
            <p className="card-desc">A helyi adminisztrátor (admin) jelszavának frissítése.</p>
          </div>
        </div>

        {passwordMessage && (
          <div
            className="card"
            style={{
              padding: "0.75rem 1rem",
              flexDirection: "row",
              alignItems: "center",
              gap: "0.5rem",
              borderColor: passwordMessage.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
              backgroundColor: passwordMessage.type === "success" ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
              color: passwordMessage.type === "success" ? "var(--status-online)" : "var(--status-error)",
            }}
          >
            {passwordMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                Jelenlegi Jelszó
              </label>
              <input
                type="password"
                className="input"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                Új Jelszó
              </label>
              <input
                type="password"
                className="input"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Legalább 3 karakter..."
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.375rem" }}>
                Új Jelszó Megerősítése
              </label>
              <input
                type="password"
                className="input"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="btn btn-primary flex items-center gap-1.5"
              style={{ alignSelf: "flex-start" }}
            >
              <Lock size={14} />
              <span>{passwordLoading ? "Mentés folyamatban..." : "Jelszó Megváltoztatása"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
