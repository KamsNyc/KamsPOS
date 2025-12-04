import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifyPin } from "@/app/lib/auth";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  // 1. Verify Store Session
  const supabase = await createClient();
  const { data: { user: storeUser }, error: authError } = await supabase.auth.getUser();

  if (!storeUser) {
    console.error("Verify PIN - No store user found:", authError);
    return NextResponse.json({ error: "Unauthorized Store Session" }, { status: 401 });
  }

  try {
    const { userId, pin } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    // 2. Find the SPECIFIC user by ID and verify they belong to this store
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        isActive: true,
        supabaseAuthId: storeUser.id  // Must belong to this store
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Verify PIN matches THIS specific user
    const isValid = await verifyPin(pin, user.pin);

    if (isValid) {
      // Set secure HTTP-only cookie with employee ID
      const cookieStore = await cookies();
      cookieStore.set("kams_pos_employee_id", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          metadata: user.metadata,
        },
      });
    }

    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });

  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

