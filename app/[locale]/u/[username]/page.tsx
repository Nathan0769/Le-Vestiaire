import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/get-current-user";
import prisma from "@/lib/prisma";

interface UsernameRedirectProps {
  params: Promise<{ username: string }>;
}

export default async function UsernameRedirectPage({
  params,
}: UsernameRedirectProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/auth/login");
  }

  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    notFound();
  }

  redirect(`/users/${user.id}/collection`);
}
