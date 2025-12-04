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
    const { name, sortOrder, icon, imageUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await prisma.menuCategory.create({
      data: {
        name,
        sortOrder: sortOrder || 0,
        icon,
        imageUrl: imageUrl && imageUrl.trim() !== "" ? imageUrl : null, // Explicitly set to null if empty/undefined
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

