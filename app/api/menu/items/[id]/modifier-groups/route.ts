import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth-server";

// POST /api/menu/items/[id]/modifier-groups - Attach modifier group to item
export async function POST(
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
    const { modifierGroupId } = body;

    if (!modifierGroupId) {
      return NextResponse.json({ error: "modifierGroupId is required" }, { status: 400 });
    }

    await prisma.menuItemModifierGroup.create({
      data: {
        menuItemId: id,
        modifierGroupId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error attaching modifier group:", error);
    return NextResponse.json({ error: "Failed to attach modifier group" }, { status: 500 });
  }
}

// DELETE /api/menu/items/[id]/modifier-groups?groupId=xxx - Remove modifier group from item
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
    const { searchParams } = new URL(request.url);
    const modifierGroupId = searchParams.get("groupId");

    if (!modifierGroupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    await prisma.menuItemModifierGroup.delete({
      where: {
        menuItemId_modifierGroupId: {
          menuItemId: id,
          modifierGroupId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing modifier group:", error);
    return NextResponse.json({ error: "Failed to remove modifier group" }, { status: 500 });
  }
}

