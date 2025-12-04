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
    const { name, sortOrder, icon, imageUrl } = body;

    const category = await prisma.menuCategory.update({
      where: { id },
      data: {
        name,
        sortOrder,
        icon,
        imageUrl: imageUrl && imageUrl.trim() !== "" ? imageUrl : null, // Explicitly set to null if empty/undefined
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
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

    // Check if category has items
    const category = await prisma.menuCategory.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });

    if (category && category._count.items > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with items. Remove items first." },
        { status: 400 }
      );
    }

    await prisma.menuCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}

