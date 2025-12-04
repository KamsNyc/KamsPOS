import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth-server";

export async function POST(request: Request) {
  const { user } = await auth();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, imageUrl, basePrice, taxRate, categoryId, isAvailable, sortOrder } = body;

    if (!name || !basePrice || !categoryId) {
      return NextResponse.json({ error: "Name, price, and category are required" }, { status: 400 });
    }

    // If sortOrder not provided, set it to the next available position
    let itemSortOrder = sortOrder;
    if (itemSortOrder === undefined) {
      const maxSortOrder = await prisma.menuItem.findFirst({
        where: { categoryId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      itemSortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl && imageUrl.trim() !== "" ? imageUrl : null, // Explicitly set to null if empty/undefined
        basePrice: basePrice,
        taxRate: taxRate || 0,
        categoryId,
        isAvailable: isAvailable ?? true,
        sortOrder: itemSortOrder,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

