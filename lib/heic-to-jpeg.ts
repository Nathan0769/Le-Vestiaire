/**
 * Convertit un fichier HEIC/HEIF (format par defaut de l'appareil photo iOS) en
 * JPEG cote navigateur. Necessaire car le storage ne doit contenir que des
 * formats affichables partout (Chrome/Firefox ne rendent pas le HEIC), et la
 * validation serveur rejette le HEIC.
 *
 * heic-to embarque libheif en wasm (~2.9MB) : import dynamique pour ne le
 * charger que lorsqu'une photo est effectivement selectionnee.
 *
 * Les fichiers non-HEIC sont retournes tels quels.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const { heicTo, isHeic } = await import("heic-to");

  // isHeic verifie les magic bytes : plus fiable que file.type, souvent vide
  // ou incoherent pour les photos issues de l'appareil iOS.
  const heic = await isHeic(file);
  if (!heic) {
    return file;
  }

  const jpegBlob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.9,
  });

  const jpegName = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";

  return new File([jpegBlob], jpegName, { type: "image/jpeg" });
}
