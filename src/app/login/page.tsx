"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });
    if (res?.error) {
      setError(t("error"));
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="container" style={{ maxWidth: "400px", marginTop: "10vh" }}>
      <div className="card">
        <h2 className="card-title text-center" style={{ marginBottom: "1.5rem" }}>{t("login")}</h2>
        
        <form onSubmit={handleLocalLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="text-muted" style={{ fontSize: "0.875rem" }}>{t("username")}</label>
            <input 
              type="text" 
              className="input" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="text-muted" style={{ fontSize: "0.875rem" }}>{t("password")}</label>
            <input 
              type="password" 
              className="input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: "0.875rem", margin: 0 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
            {t("login")} (Local)
          </button>
        </form>

        <div style={{ margin: "2rem 0", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
          <span style={{ backgroundColor: "var(--card-bg)", padding: "0 0.5rem", position: "relative", top: "10px", fontSize: "0.875rem", color: "var(--text-muted)" }}>VAGY</span>
        </div>

        <button 
          onClick={() => signIn("authentik", { callbackUrl: "/" })} 
          className="btn" 
          style={{ width: "100%" }}
        >
          SSO Bejelentkezés (Authentik)
        </button>
      </div>
    </div>
  );
}
