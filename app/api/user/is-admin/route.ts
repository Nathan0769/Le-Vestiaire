import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ isAdmin: false, isSuperAdmin: false });
    }

    const isAdmin = user.role === "admin" || user.role === "superadmin";
    const isSuperAdmin = user.role === "superadmin";

    return NextResponse.json({ isAdmin, isSuperAdmin });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false, isSuperAdmin: false });
  }
}
