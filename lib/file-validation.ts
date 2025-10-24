import { fileTypeFromBuffer } from "file-type";

/**
 * Types d'images autorisés pour les uploads
 */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;

/**
 * Taille maximale par défaut : 5MB
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Résultat de la validation
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
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
  // Vérifier la taille
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `Le fichier ne doit pas dépasser ${maxSizeMB}MB`,
    };
  }

  // Vérifier la taille minimale (1KB)
  if (file.size < 1024) {
    return {
      valid: false,
      error: "Le fichier est trop petit pour être une image valide",
    };
  }

  try {
    // Lire le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Détecter le type réel via les magic bytes
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      return {
        valid: false,
        error: "Impossible de détecter le type de fichier",
      };
    }

    // Vérifier que c'est bien un type d'image autorisé
    if (!ALLOWED_IMAGE_TYPES.includes(fileType.mime as any)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés : ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`,
        detectedType: fileType.mime,
      };
    }

    // Tout est OK
    return {
      valid: true,
      detectedType: fileType.mime,
    };
  } catch (error) {
    console.error("Erreur lors de la validation du fichier:", error);
    return {
      valid: false,
      error: "Erreur lors de la validation du fichier",
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
  // Vérifier la taille
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `Le fichier ne doit pas dépasser ${maxSizeMB}MB`,
    };
  }

  // Vérifier le type déclaré (première barrière, pas fiable à 100%)
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types acceptés : ${ALLOWED_IMAGE_EXTENSIONS.join(", ")}`,
    };
  }

  return { valid: true };
}
