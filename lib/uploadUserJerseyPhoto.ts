import { supabase } from "./supabaseClient";

async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      const MAX_WIDTH = 1920;
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Impossible de créer le contexte canvas"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Erreur lors de la conversion WebP"));
          }
        },
        "image/webp",
        0.95
      );
    };

    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadUserJerseyPhoto(
  file: File,
  userId: string,
  userJerseyId: string
): Promise<{ url: string; path: string }> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La photo ne doit pas dépasser 5MB");
  }

  const webpBlob = await convertToWebP(file);

  const timestamp = Date.now();
  const filePath = `${userId}/${userJerseyId}-${timestamp}.webp`;

  const { error } = await supabase.storage
    .from("user-jersey-photos")
    .upload(filePath, webpBlob, {
      upsert: true,
      contentType: "image/webp",
    });

  if (error) throw error;

  const { data } = await supabase.storage
    .from("user-jersey-photos")
    .createSignedUrl(filePath, 60 * 60);

  if (!data?.signedUrl) {
    throw new Error("Impossible de générer l'URL signée");
  }

  return {
    url: data.signedUrl,
    path: filePath,
  };
}

export async function deleteUserJerseyPhoto(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from("user-jersey-photos")
    .remove([filePath]);

  if (error) throw error;
}
