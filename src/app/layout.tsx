import type { Metadata } from "next";
import "./globals.css";

import { ClientProviders } from "@/components/ClientProviders";

export const metadata: Metadata = {
  title: "HomeHub",
  description: "Homelab Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
