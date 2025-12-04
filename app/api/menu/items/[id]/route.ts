import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth-server";
import { createClient } from "@/app/lib/supabase/server";

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
    const { name, description, imageUrl, basePrice, taxRate, categoryId, isAvailable, sortOrder } = body;

    // If only sortOrder is provided, only update that field (for reordering)
    if (sortOrder !== undefined && name === undefined && description === undefined && imageUrl === undefined && basePrice === undefined && taxRate === undefined && categoryId === undefined && isAvailable === undefined) {
      const item = await prisma.menuItem.update({
        where: { id },
        data: { sortOrder },
      });
      return NextResponse.json(item);
    }

    // Get the current item to check for old image
    const currentItem = await prisma.menuItem.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    // If there's an old image and it's being replaced or removed, delete it from storage
    if (currentItem?.imageUrl && imageUrl !== undefined && currentItem.imageUrl !== imageUrl) {
      try {
        const supabase = await createClient();
        
        // Extract the file path from the Supabase Storage URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/images/[folder]/[filename]
        const urlParts = currentItem.imageUrl.split('/storage/v1/object/public/images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          // Delete the old image from storage
          const { error: deleteError } = await supabase.storage
            .from('images')
            .remove([filePath]);
          
          if (deleteError) {
            console.error("Error deleting old image from storage:", deleteError);
            // Don't fail the update if deletion fails, just log it
          }
        }
      } catch (storageError) {
        console.error("Error handling image deletion:", storageError);
        // Continue with the update even if storage deletion fails
      }
    }

    // Build update data only with provided fields
    const updateData: {
      name?: string;
      description?: string | null;
      imageUrl?: string | null;
      basePrice?: string;
      taxRate?: string;
      categoryId?: string;
      isAvailable?: boolean;
      sortOrder?: number;
    } = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl && imageUrl.trim() !== "" ? imageUrl : null;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (taxRate !== undefined) updateData.taxRate = taxRate;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const item = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
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

    // Get the item to check for image before deleting
    const item = await prisma.menuItem.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    // Delete the item from database
    await prisma.menuItem.delete({
      where: { id },
    });

    // If item had an image, delete it from storage
    if (item?.imageUrl) {
      try {
        const supabase = await createClient();
        
        // Extract the file path from the Supabase Storage URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/images/[folder]/[filename]
        const urlParts = item.imageUrl.split('/storage/v1/object/public/images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          
          // Delete the image from storage
          const { error: deleteError } = await supabase.storage
            .from('images')
            .remove([filePath]);
          
          if (deleteError) {
            console.error("Error deleting image from storage:", deleteError);
            // Don't fail the delete if storage deletion fails, just log it
          }
        }
      } catch (storageError) {
        console.error("Error handling image deletion:", storageError);
        // Continue even if storage deletion fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}

