"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, KeyRound, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });
      if (res?.error) {
        setError(t("error") + ": Hibás felhasználónév vagy jelszó");
      } else {
        router.push("/admin");
      }
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "420px", marginTop: "8vh" }}>
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <div style={{
          width: "42px",
          height: "42px",
          background: "#ffffff",
          color: "#000000",
          borderRadius: "var(--radius-sm)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "1.25rem",
          letterSpacing: "-0.05em",
          marginBottom: "0.75rem"
        }}>
          H
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
          HomeHUB Bejelentkezés
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Lépj be az otthoni szolgáltatásaid kezeléséhez
        </p>
      </div>

      <div className="card" style={{ gap: "1.25rem" }}>
        {/* Authentik SSO Primary Option */}
        <button
          type="button"
          onClick={() => signIn("authentik", { callbackUrl: "/" })}
          className="btn btn-primary"
          style={{ width: "100%", padding: "0.625rem 1rem", fontSize: "0.875rem" }}
        >
          <Shield size={16} />
          <span>Authentik SSO Belépés</span>
        </button>

        <div style={{ position: "relative", textAlign: "center", margin: "0.5rem 0" }}>
          <div style={{ position: "absolute", inset: "50% 0 auto 0", borderTop: "1px solid var(--border)" }} />
          <span style={{ position: "relative", background: "var(--surface)", padding: "0 0.75rem", fontSize: "0.6875rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            VAGY LOKÁLIS ADMIN
          </span>
        </div>

        {/* Local Admin Login Form */}
        <form onSubmit={handleLocalLogin} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label htmlFor="username-input" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
              {t("username")}
            </label>
            <input
              id="username-input"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label htmlFor="password-input" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
              {t("password")}
            </label>
            <input
              id="password-input"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5" style={{ color: "var(--status-error)", fontSize: "0.75rem" }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn flex items-center justify-center gap-1.5"
            style={{ marginTop: "0.5rem", width: "100%" }}
          >
            <KeyRound size={14} />
            <span>{loading ? "Belépés..." : "Lokális Belépés"}</span>
          </button>
        </form>
      </div>

      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <Link href="/" className="btn btn-sm btn-ghost flex items-center justify-center gap-1.5" style={{ color: "var(--text-dim)" }}>
          <ArrowLeft size={14} />
          <span>Vissza a kezdőlapra</span>
        </Link>
      </div>
    </div>
  );
}
