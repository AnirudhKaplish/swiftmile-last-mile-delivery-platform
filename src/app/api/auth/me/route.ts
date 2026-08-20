// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest, getFullUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getCurrentUserFromRequest(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await getFullUser(session.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        customerProfile: user.customerProfile,
        agentProfile: user.agentProfile,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch user" }, { status: 500 });
  }
}
