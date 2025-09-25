import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function getCurrentUser() {
  console.time("🚀 getCurrentUser - Direct");

  try {
    const cookieStore = await cookies();

    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieStore.toString(),
      }),
    });

    console.timeEnd("🚀 getCurrentUser - Direct");
    console.log(
      `👤 User: ${
        session?.user ? `${session.user.id} (connecté)` : "non connecté"
      }`
    );

    return session?.user ?? null;
  } catch (error) {
    console.error("❌ Direct auth error:", error);
    console.timeEnd("🚀 getCurrentUser - Direct");
    return null;
  }
}
