// src/app/api/analytics/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      activeDeliveries,
      deliveredToday,
      failedDeliveries,
      revenueResult,
      availableAgentsCount,
      totalAgentsCount,
      ordersByStatusRaw,
      ordersByZoneRaw,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: { status: { in: ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } },
      }),
      prisma.order.count({
        where: {
          status: "DELIVERED",
          updatedAt: { gte: todayStart },
        },
      }),
      prisma.order.count({
        where: { status: "FAILED" },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
      prisma.agentProfile.count({
        where: { status: "AVAILABLE" },
      }),
      prisma.agentProfile.count(),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["pickupZoneId"],
        _count: { id: true },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          pickupZone: { select: { name: true } },
          dropZone: { select: { name: true } },
        },
      }),
    ]);

    // Format status distribution
    const statusCounts: Record<string, number> = {
      CREATED: 0,
      PICKED_UP: 0,
      IN_TRANSIT: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      FAILED: 0,
    };
    ordersByStatusRaw.forEach((item) => {
      statusCounts[item.status] = item._count.id;
    });

    // Format zone distribution with names
    const allZones = await prisma.zone.findMany();
    const zoneMap = new Map(allZones.map((z) => [z.id, z.name]));
    const ordersByZone = ordersByZoneRaw.map((item) => ({
      zoneId: item.pickupZoneId,
      zoneName: zoneMap.get(item.pickupZoneId) || "Other Zone",
      count: item._count.id,
    }));

    const totalDelivered = statusCounts["DELIVERED"] || 0;
    const totalAttemptedResolved = totalDelivered + failedDeliveries;
    const successRate =
      totalAttemptedResolved > 0
        ? Math.round((totalDelivered / totalAttemptedResolved) * 100)
        : 100;

    const totalRevenue = Math.round((revenueResult._sum.totalAmount || 0) * 100) / 100;

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        activeDeliveries,
        deliveredToday,
        failedDeliveries,
        totalRevenue,
        availableAgentsCount,
        totalAgentsCount,
        successRate,
      },
      charts: {
        statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
        })),
        zoneDistribution: ordersByZone,
      },
      recentOrders,
    });
  } catch (error: any) {
    console.error("Dashboard Analytics Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
