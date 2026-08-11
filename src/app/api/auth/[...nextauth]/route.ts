import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const handler = (req: NextRequest, context: { params: { nextauth: string[] } }) => {
  const authOptions = getAuthOptions();
  return NextAuth(authOptions)(req as any, context as any);
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  return handler(req, { params: await params });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ nextauth: string[] }> }) {
  return handler(req, { params: await params });
}
