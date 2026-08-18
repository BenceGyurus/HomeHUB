import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AuthentikProvider from "next-auth/providers/authentik";
import db from "./db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { RequestInternal } from "next-auth";
import { logger } from "./logger";

// Trust all incoming host headers (IPs, domains, reverse proxies)
if (!process.env.AUTH_TRUST_HOST) {
  process.env.AUTH_TRUST_HOST = "true";
}

export const getAuthOptions = (): NextAuthOptions => {
  // Read settings from DB
  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as Record<string, string>);

  const providers = [];

  // Local login
  providers.push(
    CredentialsProvider({
      name: 'Local Admin',
      credentials: {
        username: { label: "Felhasználónév", type: "text" },
        password: { label: "Jelszó", type: "password" }
      },
      async authorize(credentials: Record<"username" | "password", string> | undefined, req: Pick<RequestInternal, "body" | "query" | "headers" | "method">) {
        if (!credentials?.username || !credentials?.password) {
          logger.auth(`Lokális bejelentkezés sikertelen: Hiányzó felhasználónév vagy jelszó`);
          return null;
        }

        logger.auth(`Lokális bejelentkezési kísérlet a(z) "${credentials.username}" felhasználóval...`);
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(credentials.username) as any;
        if (!user) {
          // SEC-10 FIX: Run dummy bcrypt.compare to prevent timing-based username enumeration
          await bcrypt.compare(credentials.password, '$2b$10$dummyhashtopreventtimingattacksenumeration');
          logger.warn('AUTH', `Sikertelen bejelentkezési kísérlet.`);
          return null;
        }
        
        const isMatch = await bcrypt.compare(credentials.password, user.password_hash);
        if (isMatch) {
          logger.auth(`Sikeres lokális bejelentkezés: ${user.username} (Admin: ${user.is_admin === 1})`);
          return { id: user.id.toString(), name: user.username, isAdmin: user.is_admin === 1, groups: [] };
        } else {
          logger.warn('AUTH', `Helytelen jelszó a(z) "${credentials.username}" felhasználóhoz.`);
        }
        return null;
      }
    })
  );

  // Authentik provider configured from DB
  if (settings.authentik_client_id && settings.authentik_client_secret && settings.authentik_issuer) {
    logger.auth(`Authentik OIDC szolgáltató betöltve (${settings.authentik_issuer})`);
    providers.push(
      AuthentikProvider({
        clientId: settings.authentik_client_id,
        clientSecret: settings.authentik_client_secret,
        issuer: settings.authentik_issuer,
      })
    );
  }

  // Detect whether we should enforce secure cookies (only if NEXTAUTH_URL explicitly starts with https)
  const isHttps = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;

  // Secure secret generation / retrieval
  // SEC-03 FIX: Reject known-insecure default values
  const INSECURE_DEFAULTS = new Set(['super-secret-change-me', 'changeme', 'secret', '']);
  const envSecret = process.env.NEXTAUTH_SECRET?.trim();
  let secret = (envSecret && !INSECURE_DEFAULTS.has(envSecret)) ? envSecret : settings.auth_secret;
  if (!secret) {
    secret = crypto.randomBytes(32).toString('hex');
    try {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('auth_secret', secret);
      logger.info('AUTH', 'Automatikus, 256-bites kriptográfiai titkosító kulcs generálva és elmentve.');
    } catch {
      // Fallback
    }
  }

  return {
    providers,
    secret,
    useSecureCookies: isHttps,
    cookies: {
      sessionToken: {
        name: isHttps ? "__Secure-next-auth.session-token" : "next-auth.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: isHttps,
        }
      }
    },
    callbacks: {
      async jwt({ token, user, account, profile }) {
        if (user) {
          token.isAdmin = (user as any).isAdmin;
          token.groups = (user as any).groups || [];
        }
        if (account?.provider === 'authentik') {
          token.provider = 'authentik';
          
          const rawGroups = (profile as any)?.groups || (profile as any)?.['ak_groups'] || [];
          const groups: string[] = Array.isArray(rawGroups)
            ? rawGroups.map((g: any) => typeof g === 'string' ? g : (g.name || g.pk || String(g)))
            : [];
          
          token.groups = groups;

          const isSuperUser = Boolean((profile as any)?.is_superuser);
          const hasAdminGroup = groups.some((g: string) => 
            ['authentik_admins', 'admins', 'admin', 'superusers'].includes(g.toLowerCase())
          );

          if (isSuperUser || hasAdminGroup) {
            token.isAdmin = true;
          }

          logger.auth(`Authentik SSO token generálva: ${(profile as any)?.preferred_username || token.name}, Csoportok: ${JSON.stringify(groups)}, Admin: ${token.isAdmin ? 'Igen' : 'Nem'}`);
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).isAdmin = token.isAdmin || false;
          (session.user as any).groups = token.groups || [];
          (session.user as any).provider = token.provider || 'local';
        }
        return session;
      }
    },
    pages: {
      signIn: '/login',
    }
  };
};
