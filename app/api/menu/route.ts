import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth-server";

// GET /api/menu - list categories with items
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const categories = await prisma.menuCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" }
        ],
        include: {
          modifierGroups: {
            include: {
              modifierGroup: {
                include: {
                  modifiers: {
                    include: {
                      prices: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(categories);
}


