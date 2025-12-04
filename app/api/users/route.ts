import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashPin } from "@/app/lib/auth";
import { auth } from "@/app/lib/auth-server";
import { createClient } from "@/app/lib/supabase/server";

// GET /api/users - List profiles (only requires store session, not employee)
// This is needed for the select-profile page before employee login
export async function GET() {
  const supabase = await createClient();
  const { data: { user: storeUser } } = await supabase.auth.getUser();

  if (!storeUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { 
        supabaseAuthId: storeUser.id,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        metadata: true,
        // Do NOT select pin
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, storeUser } = await auth();
  if (!userId || !storeUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, pin, role, email } = body;

  if (!name || !pin || pin.length < 4) {
      return NextResponse.json({ error: "Invalid input. Name and PIN (min 4 digits) are required." }, { status: 400 });
  }

  try {
    const hashedPin = await hashPin(pin);
    
    const newUser = await prisma.user.create({
        data: {
            name,
            pin: hashedPin,
            role: role || "CASHIER",
            email,
            supabaseAuthId: storeUser.id,
            isActive: true
        }
    });

    // Return without PIN
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin: unusedPin, ...safeUser } = newUser;
    
    return NextResponse.json(safeUser, { status: 201 });
  } catch(err) {
      console.error("Error creating user:", err);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
