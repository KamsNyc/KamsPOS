import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth-server";

export async function GET() {
  const { user } = await auth();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const groups = await prisma.modifierGroup.findMany({
      include: {
        modifiers: {
          include: {
            prices: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching modifier groups:", error);
    return NextResponse.json({ error: "Failed to fetch modifier groups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user } = await auth();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, minSelect, maxSelect, hideOrderSection, requiresSizeFirst, sizeBasedPricing, isOptional } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const group = await prisma.modifierGroup.create({
      data: {
        name,
        minSelect: minSelect ?? 0,
        maxSelect: maxSelect ?? 99,
        hideOrderSection: hideOrderSection ?? false,
        requiresSizeFirst: requiresSizeFirst ?? false,
        sizeBasedPricing: sizeBasedPricing ?? false,
        isOptional: isOptional ?? false,
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error creating modifier group:", error);
    return NextResponse.json({ error: "Failed to create modifier group" }, { status: 500 });
  }
}

