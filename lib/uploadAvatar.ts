import { supabase } from "./supabaseClient";

export async function uploadAvatar(
  file: File,
  userId: string
): Promise<{ url: string }> {
  const filePath = `${userId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("avatar")
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data } = await supabase.storage
    .from("avatar")
    .createSignedUrl(filePath, 60 * 60);

  if (!data?.signedUrl) throw new Error("Impossible de générer l'URL signée");

  return { url: data.signedUrl };
}
