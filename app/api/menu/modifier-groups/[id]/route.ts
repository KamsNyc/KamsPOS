import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await auth();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, minSelect, maxSelect, hideOrderSection, requiresSizeFirst, sizeBasedPricing, isOptional } = body;

    const group = await prisma.modifierGroup.update({
      where: { id },
      data: {
        name,
        minSelect,
        maxSelect,
        hideOrderSection: hideOrderSection ?? false,
        requiresSizeFirst: requiresSizeFirst ?? false,
        sizeBasedPricing: sizeBasedPricing ?? false,
        isOptional: isOptional ?? false,
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error updating modifier group:", error);
    return NextResponse.json({ error: "Failed to update modifier group" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await auth();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.modifierGroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting modifier group:", error);
    return NextResponse.json({ error: "Failed to delete modifier group" }, { status: 500 });
  }
}

