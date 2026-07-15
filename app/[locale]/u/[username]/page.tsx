import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; username: string }>;
}

export default async function UserProfileIndex({ params }: PageProps) {
  const { locale, username } = await params;
  redirect(`/${locale}/u/${username.toLowerCase()}/collection`);
}
