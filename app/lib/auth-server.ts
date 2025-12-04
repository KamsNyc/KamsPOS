import { cookies } from "next/headers";
import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "@prisma/client";

export interface AuthResult {
  userId: string | null;
  user: User | null;
  storeUser: SupabaseUser | null;
  isAuthenticated: boolean;
}

/**
 * Server-side auth helper (Clerk-like API)
 * Gets the current authenticated store user and employee user
 * 
 * @returns {Promise<AuthResult>} Object with userId, user, storeUser, and isAuthenticated
 * 
 * @example
 * ```ts
 * const { userId, user, isAuthenticated } = await auth();
 * if (!userId) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * ```
 */
export async function auth(): Promise<AuthResult> {
  // 1. Get store user from Supabase session
  const supabase = await createClient();
  const { data: { user: storeUser } } = await supabase.auth.getUser();

  // If no store session, return unauthenticated
  if (!storeUser) {
    return {
      userId: null,
      user: null,
      storeUser: null,
      isAuthenticated: false,
    };
  }

  // 2. Get employee ID from secure HTTP-only cookie
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("kams_pos_employee_id")?.value;

  // If no employee cookie, return store user but no employee
  if (!employeeId) {
    return {
      userId: null,
      user: null,
      storeUser,
      isAuthenticated: false, // Not fully authenticated (no employee)
    };
  }

  // 3. Fetch full employee/user record from database
  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: employeeId,
        isActive: true, // Only return active users
      },
    });

    if (!user) {
      // Employee ID in cookie but user not found or inactive
      return {
        userId: null,
        user: null,
        storeUser,
        isAuthenticated: false,
      };
    }

    return {
      userId: user.id,
      user,
      storeUser,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("Error fetching user in auth():", error);
    return {
      userId: null,
      user: null,
      storeUser,
      isAuthenticated: false,
    };
  }
}

