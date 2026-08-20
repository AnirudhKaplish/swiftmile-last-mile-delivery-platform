// src/app/api/auth/demo-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    if (!["ADMIN", "DELIVERY_AGENT", "CUSTOMER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified for demo login" }, { status: 400 });
    }

    // Find first seeded user matching role
    const user = await prisma.user.findFirst({
      where: { role },
      include: {
        customerProfile: true,
        agentProfile: { include: { currentZone: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: `No seeded demo user found for role ${role}. Please run db seed.` }, { status: 404 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agentProfile: user.agentProfile,
        customerProfile: user.customerProfile,
      },
      message: `Switched to Demo ${role} persona: ${user.name}`,
    });

    res.cookies.set("swiftmile_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (error: any) {
    console.error("Demo Login Error:", error);
    return NextResponse.json({ error: error.message || "Failed demo login" }, { status: 500 });
  }
}
