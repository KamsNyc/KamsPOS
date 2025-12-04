import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashPin } from "@/app/lib/auth";
import { Prisma } from "@prisma/client";
import { auth } from "@/app/lib/auth-server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, storeUser } = await auth();
  if (!userId || !storeUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, pin, role, email } = body;

  try {
    // If trying to change role, check if user is changing their own role
    if (role && id === userId) {
      // Get current user's role
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true }
      });
      
      // If current user is ADMIN and trying to change to non-ADMIN
      if (currentUser?.role === "ADMIN" && role !== "ADMIN") {
        // Count other admins
        const adminCount = await prisma.user.count({
          where: {
            supabaseAuthId: storeUser.id,
            role: "ADMIN",
            isActive: true
          }
        });
        
        if (adminCount <= 1) {
          return NextResponse.json({ 
            error: "Cannot change role. You are the only admin." 
          }, { status: 400 });
        }
      }
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (email !== undefined) updateData.email = email;
    if (pin) {
        updateData.pin = await hashPin(pin);
    }

    const updatedUser = await prisma.user.update({
        where: { 
            id,
            supabaseAuthId: storeUser.id
        },
        data: updateData
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin: unusedPin, ...safeUser } = updatedUser;
    return NextResponse.json(safeUser);
  } catch(err) {
      console.error("Error updating user:", err);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, storeUser } = await auth();
  if (!userId || !storeUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent self-deletion
  if (id === userId) {
    return NextResponse.json({ 
      error: "Cannot delete your own account" 
    }, { status: 400 });
  }

  try {
    // Soft delete
    await prisma.user.update({
        where: { 
            id,
            supabaseAuthId: storeUser.id
        },
        data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch(err) {
      console.error("Error deleting user:", err);
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
