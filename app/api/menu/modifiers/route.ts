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
    const { name, groupId, prices } = body; // prices: [{ sizeLabel: "Small", price: "1.00" }, ...]

    if (!name || !groupId) {
      return NextResponse.json({ error: "Name and groupId are required" }, { status: 400 });
    }

    const modifier = await prisma.modifier.create({
      data: {
        name,
        groupId,
        prices: {
          create: prices?.map((p: { sizeLabel: string; price: string }) => ({
            sizeLabel: p.sizeLabel,
            price: p.price,
          })) || [],
        },
      },
      include: {
        prices: true,
      },
    });

    return NextResponse.json(modifier);
  } catch (error) {
    console.error("Error creating modifier:", error);
    return NextResponse.json({ error: "Failed to create modifier" }, { status: 500 });
  }
}

