import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth-server";

export async function GET(request: Request) {
  const { user } = await auth();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "today";

  const now = new Date();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (range === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (range === "month") {
    startDate.setDate(now.getDate() - 30);
  }

  try {
    // 1. Total Sales & Count
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        items: true,
      },
    });

    // Infer type from the query result
    type OrderWithItems = (typeof orders)[number];

    const totalSales = orders.reduce((sum: number, order: OrderWithItems) => sum + parseFloat(order.total.toString()), 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

    // 2. Payment Methods
    const paymentMethods = orders.reduce((acc: Record<string, number>, order: OrderWithItems) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 3. Order Types
    const orderTypes = orders.reduce((acc: Record<string, number>, order: OrderWithItems) => {
      acc[order.type] = (acc[order.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 4. Top Items
    const itemCounts = {} as Record<string, number>;
    orders.forEach(order => {
        order.items.forEach(item => {
            itemCounts[item.nameSnapshot] = (itemCounts[item.nameSnapshot] || 0) + item.quantity;
        });
    });

    const topItems = Object.entries(itemCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      totalSales,
      orderCount,
      averageOrderValue,
      paymentMethods,
      orderTypes,
      topItems,
      range,
    });

  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

