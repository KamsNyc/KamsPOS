import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createClient } from "@/app/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user: storeUser } } = await supabase.auth.getUser();

  if (!storeUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify prisma.store exists
    if (!prisma.store) {
      console.error("Prisma Store model not available. Client may need regeneration.");
      return NextResponse.json({ error: "Database client not initialized. Please restart the server." }, { status: 500 });
    }

    const store = await prisma.store.findUnique({
      where: { ownerId: storeUser.id }
    });
    return NextResponse.json(store || null);
  } catch (error) {
    console.error("Error fetching store:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to fetch store: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: storeUser } } = await supabase.auth.getUser();

  if (!storeUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, street, city, state, zip, phone, email, logoUrl } = body;

  if (!name) {
    return NextResponse.json({ error: "Store name is required" }, { status: 400 });
  }

  try {
    // Verify prisma.store exists
    if (!prisma.store) {
      console.error("Prisma Store model not available. Client may need regeneration.");
      return NextResponse.json({ error: "Database client not initialized. Please restart the server." }, { status: 500 });
    }

    const store = await prisma.store.upsert({
      where: { ownerId: storeUser.id },
      update: {
        name,
        street,
        city,
        state,
        zip,
        phone,
        email,
        logoUrl
      },
      create: {
        ownerId: storeUser.id,
        name,
        street,
        city,
        state,
        zip,
        phone,
        email,
        logoUrl
      }
    });

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error saving store:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to save store: ${errorMessage}` }, { status: 500 });
  }
}
