import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export function middleware(req: NextRequest) {
  const { method, nextUrl } = req;
  const path = nextUrl.pathname;

  // Skip static assets
  if (
    path.startsWith("/_next/static") || 
    path.startsWith("/_next/image") || 
    path === "/favicon.ico" ||
    path.endsWith(".css") ||
    path.endsWith(".js") ||
    path.endsWith(".png") ||
    path.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("x-real-ip") || 
                   "local";
  const host = req.headers.get("host") || "unknown";

  logger.http(`--> ${method} ${path} (from ${clientIp}, Host: ${host})`);

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
