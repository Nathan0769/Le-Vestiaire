import { cookies } from "next/headers";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const res = await fetch(
    `${process.env.BETTER_AUTH_URL}/api/auth/get-session`,
    {
      headers: {
        cookie: cookieStore.toString(),
      },
      credentials: "include",
    }
  );

  if (!res.ok) return null;

  const session = await res.json();
  return session?.user ?? null;
}
