import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();

    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieStore.toString(),
      }),
    });

    return session?.user ?? null;
  } catch (error) {
    console.error("❌ Direct auth error:", error);
    return null;
  }
}
