import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { testAuthentikConnection } from "@/lib/authentik";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ success: false, error: "Nem vagy bejelentkezve adminisztrátorként (403)" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { url, token } = body;
    const result = await testAuthentikConnection(url, token);
    return NextResponse.json({ 
      success: true, 
      message: `Sikeres kapcsolat az Authentik API-val! ${result.count} alkalmazás elérhető.` 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Nem sikerült kapcsolódni az Authentik szerverhez." 
    }, { status: 400 });
  }
}

export async function GET() {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ success: false, error: "Nem vagy bejelentkezve adminisztrátorként (403)" }, { status: 403 });
  }

  try {
    const result = await testAuthentikConnection();
    return NextResponse.json({ 
      success: true, 
      message: `Sikeres kapcsolat az Authentik API-val! ${result.count} alkalmazás elérhető.` 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Nem sikerült kapcsolódni az Authentik szerverhez." 
    }, { status: 400 });
  }
}
