import { supabase } from "./supabaseClient";

export async function uploadJerseyImage(userId: string, file: File) {
  const filePath = `${userId}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("jerseys")
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage.from("jerseys").getPublicUrl(filePath);

  return { path: filePath, url: data.publicUrl };
}
