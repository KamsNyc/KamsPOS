import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/app/lib/supabase/server";

export async function POST() {
  // Verify store session exists
  const supabase = await createClient();
  const { data: { user: storeUser } } = await supabase.auth.getUser();

  if (!storeUser) {
    return NextResponse.json({ error: "Unauthorized Store Session" }, { status: 401 });
  }

  // Clear the employee cookie
  const cookieStore = await cookies();
  cookieStore.delete("kams_pos_employee_id");

  return NextResponse.json({ success: true });
}

