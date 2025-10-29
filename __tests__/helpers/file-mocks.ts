/**
 * Helpers pour créer des fichiers de test avec les bons magic bytes
 */

/**
 * Crée un fichier JPEG valide avec les magic bytes corrects
 */
export function createValidJpegFile(name = 'test.jpg', size = 1000): File {
  // Magic bytes JPEG: FF D8 FF
  const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
  const content = new Uint8Array(size)
  content.set(jpegHeader, 0)

  const blob = new Blob([content], { type: 'image/jpeg' })
  return new File([blob], name, { type: 'image/jpeg' })
}

/**
 * Crée un fichier PNG valide avec les magic bytes corrects
 */
export function createValidPngFile(name = 'test.png', size = 1000): File {
  // Magic bytes PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const content = new Uint8Array(size)
  content.set(pngHeader, 0)

  const blob = new Blob([content], { type: 'image/png' })
  return new File([blob], name, { type: 'image/png' })
}

/**
 * Crée un fichier WebP valide avec les magic bytes corrects
 */
export function createValidWebpFile(name = 'test.webp', size = 1000): File {
  // Magic bytes WebP: 52 49 46 46 [4 bytes] 57 45 42 50
  const webpHeader = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x00, 0x00, 0x00, 0x00, // File size (placeholder)
    0x57, 0x45, 0x42, 0x50, // "WEBP"
  ])
  const content = new Uint8Array(size)
  content.set(webpHeader, 0)

  const blob = new Blob([content], { type: 'image/webp' })
  return new File([blob], name, { type: 'image/webp' })
}

/**
 * Crée un fichier avec de faux magic bytes (fichier texte déguisé en image)
 * Utile pour tester la validation server-side
 */
export function createFakeImageFile(
  name = 'fake.jpg',
  mimeType = 'image/jpeg'
): File {
  // Contenu texte sans magic bytes d'image
  const content = new TextEncoder().encode('This is not an image file')
  const blob = new Blob([content], { type: mimeType })
  return new File([blob], name, { type: mimeType })
}

/**
 * Crée un fichier trop gros pour tester la limite de taille
 */
export function createOversizedFile(maxSize: number): File {
  const size = maxSize + 1000 // Dépasse la limite
  const content = new Uint8Array(size)

  // Ajouter les magic bytes JPEG pour que seule la taille soit le problème
  const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
  content.set(jpegHeader, 0)

  const blob = new Blob([content], { type: 'image/jpeg' })
  return new File([blob], 'large.jpg', { type: 'image/jpeg' })
}
