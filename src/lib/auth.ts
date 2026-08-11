import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AuthentikProvider from "next-auth/providers/authentik";
import db from "./db";
import bcrypt from "bcrypt";
import type { RequestInternal } from "next-auth";

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
        if (!credentials?.username || !credentials?.password) return null;
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(credentials.username) as any;
        if (!user) return null;
        
        const isMatch = await bcrypt.compare(credentials.password, user.password_hash);
        if (isMatch) {
          return { id: user.id.toString(), name: user.username, isAdmin: user.is_admin === 1 };
        }
        return null;
      }
    })
  );

  // Authentik provider configured from DB
  if (settings.authentik_client_id && settings.authentik_client_secret && settings.authentik_issuer) {
    providers.push(
      AuthentikProvider({
        clientId: settings.authentik_client_id,
        clientSecret: settings.authentik_client_secret,
        issuer: settings.authentik_issuer,
      })
    );
  }

  return {
    providers,
    secret: process.env.NEXTAUTH_SECRET || "default_secret_for_local_dev",
    callbacks: {
      async jwt({ token, user, account, profile }) {
        if (user) {
          token.isAdmin = (user as any).isAdmin;
        }
        if (account?.provider === 'authentik') {
          token.provider = 'authentik';
          token.groups = (profile as any)?.groups || [];
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
