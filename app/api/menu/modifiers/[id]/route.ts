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
    const { name, prices } = body;

    // Update modifier name
    await prisma.modifier.update({
      where: { id },
      data: {
        name,
      },
    });

    // Update prices if provided
    if (prices && Array.isArray(prices)) {
      // Delete existing prices
      await prisma.modifierPrice.deleteMany({
        where: { modifierId: id },
      });

      // Create new prices
      await prisma.modifierPrice.createMany({
        data: prices.map((p: { sizeLabel: string; price: string }) => ({
          modifierId: id,
          sizeLabel: p.sizeLabel,
          price: p.price,
        })),
      });
    }

    const updated = await prisma.modifier.findUnique({
      where: { id },
      include: { prices: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating modifier:", error);
    return NextResponse.json({ error: "Failed to update modifier" }, { status: 500 });
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

    await prisma.modifier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting modifier:", error);
    return NextResponse.json({ error: "Failed to delete modifier" }, { status: 500 });
  }
}

