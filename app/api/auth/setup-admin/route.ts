import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashPin } from "@/app/lib/auth";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, pin, email } = body;

    if (!name || !pin) {
      return NextResponse.json({ error: "Name and PIN are required" }, { status: 400 });
    }

    const hashedPin = await hashPin(pin);

    // Create admin user linked to this Supabase Auth user (store owner)
    const newUser = await prisma.user.create({
      data: {
        name,
        pin: hashedPin,
        email,
        role: "ADMIN",
        isActive: true,
        supabaseAuthId: user.id,  // Link to the store account!
      },
    });

    // Return without PIN
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin: unusedPin, ...safeUser } = newUser;

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Setup admin error:", error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}

