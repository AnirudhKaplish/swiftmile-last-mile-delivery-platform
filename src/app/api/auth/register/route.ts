// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone, role = "CUSTOMER", companyName, gstin, vehicleType, vehicleNumber, zoneId } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          name,
          phone,
          role,
        },
      });

      if (role === "CUSTOMER") {
        await tx.customerProfile.create({
          data: {
            userId: newUser.id,
            companyName,
            gstin,
          },
        });
      } else if (role === "DELIVERY_AGENT") {
        await tx.agentProfile.create({
          data: {
            userId: newUser.id,
            vehicleType: vehicleType || "Bike",
            vehicleNumber: vehicleNumber || "KA-01-EA-9999",
            currentZoneId: zoneId || null,
            status: "AVAILABLE",
          },
        });
      }

      return newUser;
    });

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
      },
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
    console.error("Register Error:", error);
    return NextResponse.json({ error: error.message || "Failed to register" }, { status: 500 });
  }
}
