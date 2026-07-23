import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function LegacyFriendWishlistRedirect({ params }: Props) {
  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { username: true },
  });
  if (!target) notFound();
  redirect(`/u/${target.username}/wishlist`);
}
