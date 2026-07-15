import { permanentRedirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export const dynamic = "force-dynamic";

export default async function LegacyWishlistRedirect({ params }: PageProps) {
  const { locale, id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { username: true },
  });
  if (!user?.username) notFound();
  permanentRedirect(`/${locale}/u/${user.username}/wishlist`);
}
