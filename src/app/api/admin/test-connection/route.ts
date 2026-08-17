import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { testAuthentikConnection } from "@/lib/authentik";

export async function POST(req: NextRequest) {
  const session = await getServerSession(getAuthOptions());
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { url, token } = body;
    const result = await testAuthentikConnection(url, token);
    return NextResponse.json({ 
      success: true, 
      message: `Sikeres kapcsolat! ${result.count} alkalmazás elérhető az Authentikben.` 
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const result = await testAuthentikConnection();
    return NextResponse.json({ 
      success: true, 
      message: `Sikeres kapcsolat! ${result.count} alkalmazás elérhető az Authentikben.` 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Nem sikerült kapcsolódni az Authentik szerverhez." 
    }, { status: 400 });
  }
}
