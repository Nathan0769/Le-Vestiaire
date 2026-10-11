import { fileTypeFromBuffer } from "file-type";

/**
 * Types d'images autorisés pour les uploads
 */
// JPEG XL (jxl) exclu volontairement : décodé uniquement par Safari, invisible sur Chrome/Firefox
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"] as const;

/**
 * Taille maximale par défaut : 10MB (pour supporter photos iPhone haute résolution)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Résultat de la validation
 */
export type FileValidationCode =
  | "FILE_TOO_LARGE"
  | "FILE_INVALID"
  | "FILE_TYPE_NOT_ALLOWED";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  /** Code stable de l'erreur, traduit par l'app mobile (le message est en français). */
  code?: FileValidationCode;
  detectedType?: string;
}

/**
 * Valide un fichier image en vérifiant :
 * 1. La taille du fichier
 * 2. Le type MIME via les magic bytes (signature du fichier)
 * 3. Que le type détecté correspond bien à une image autorisée
 *
 * @param file - Le fichier à valider
 * @param maxSize - Taille maximale en bytes (défaut: 5MB)
 * @returns Résultat de la validation
 */
export async function validateImageFile(
  file: File,
  maxSize: number = MAX_FILE_SIZE
): Promise<FileValidationResult> {
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Votre photo est trop volumineuse (${fileSizeMB}MB). La taille maximale autorisée est de ${maxSizeMB}MB. Veuillez compresser votre image.`,
      code: "FILE_TOO_LARGE",
    };
  }

  if (file.size < 1024) {
    return {
      valid: false,
      error: "Le fichier est trop petit pour être une image valide",
      code: "FILE_INVALID",
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      return {
        valid: false,
        error: "Impossible de détecter le type de fichier",
        code: "FILE_INVALID",
      };
    }

    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(fileType.mime)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés : ${ALLOWED_IMAGE_EXTENSIONS.join(
          ", "
        )}`,
        code: "FILE_TYPE_NOT_ALLOWED",
        detectedType: fileType.mime,
      };
    }

    return {
      valid: true,
      detectedType: fileType.mime,
    };
  } catch (error) {
    console.error("Erreur lors de la validation du fichier:", error);
    return {
      valid: false,
      error: "Erreur lors de la validation du fichier",
      code: "FILE_INVALID",
    };
  }
}

/**
 * Valide un fichier image de manière synchrone (vérifications basiques uniquement)
 * À utiliser côté client pour un feedback rapide
 *
 * @param file - Le fichier à valider
 * @param maxSize - Taille maximale en bytes
 */
export function validateImageFileBasic(
  file: File,
  maxSize: number = MAX_FILE_SIZE
): FileValidationResult {
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Votre photo est trop volumineuse (${fileSizeMB}MB). La taille maximale autorisée est de ${maxSizeMB}MB. Veuillez compresser votre image.`,
      code: "FILE_TOO_LARGE",
    };
  }

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types acceptés : ${ALLOWED_IMAGE_EXTENSIONS.join(
        ", "
      )}`,
        code: "FILE_TYPE_NOT_ALLOWED",
    };
  }

  return { valid: true };
}
