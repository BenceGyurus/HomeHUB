import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { nextauth: string[] } }) {
  const authOptions = getAuthOptions();
  return NextAuth(authOptions)(req as any, { params } as any);
}

export async function POST(req: NextRequest, { params }: { params: { nextauth: string[] } }) {
  const authOptions = getAuthOptions();
  return NextAuth(authOptions)(req as any, { params } as any);
}
