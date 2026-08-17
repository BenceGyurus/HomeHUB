import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AuthentikProvider from "next-auth/providers/authentik";
import db from "./db";
import bcrypt from "bcryptjs";
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
          logger.warn('AUTH', `Nem található felhasználó "${credentials.username}" néven az adatbázisban.`);
          return null;
        }
        
        const isMatch = await bcrypt.compare(credentials.password, user.password_hash);
        if (isMatch) {
          logger.auth(`Sikeres lokális bejelentkezés: ${user.username} (Admin: ${user.is_admin === 1})`);
          return { id: user.id.toString(), name: user.username, isAdmin: user.is_admin === 1 };
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

  return {
    providers,
    secret: process.env.NEXTAUTH_SECRET || "default_secret_for_local_dev",
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
        }
        if (account?.provider === 'authentik') {
          token.provider = 'authentik';
          token.groups = (profile as any)?.groups || [];
          logger.auth(`Authentik SSO token generálva: ${(profile as any)?.preferred_username || token.name}, Csoportok: ${JSON.stringify(token.groups)}`);
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
