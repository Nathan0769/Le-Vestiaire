import { describe, it, expect } from 'vitest'
import { validateImageFileBasic, MAX_FILE_SIZE } from '@/lib/file-validation'

// Helper pour créer un mock File (pour tests basiques uniquement)
function createMockFile(
  size: number,
  filename: string,
  mimeType: string
): File {
  const content = new Uint8Array(size)
  const blob = new Blob([content], { type: mimeType })
  return new File([blob], filename, { type: mimeType })
}

describe('file-validation', () => {
  // TODO: Tests de validateImageFile() avec magic bytes nécessitent un polyfill File.arrayBuffer()
  // Ces tests seront ajoutés en E2E avec de vrais fichiers

  describe('validateImageFileBasic', () => {
    it('refuse un fichier trop gros', () => {
      const file = createMockFile(MAX_FILE_SIZE + 1, 'large.jpg', 'image/jpeg')

      const result = validateImageFileBasic(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('ne doit pas dépasser')
    })

    it('accepte un fichier de taille valide', () => {
      const file = createMockFile(5000, 'image.jpg', 'image/jpeg')

      const result = validateImageFileBasic(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepte un type MIME valide (JPEG)', () => {
      const file = createMockFile(5000, 'image.jpg', 'image/jpeg')

      const result = validateImageFileBasic(file)

      expect(result.valid).toBe(true)
    })

    it('accepte un type MIME valide (PNG)', () => {
      const file = createMockFile(5000, 'image.png', 'image/png')

      const result = validateImageFileBasic(file)

      expect(result.valid).toBe(true)
    })

    it('accepte un type MIME valide (WebP)', () => {
      const file = createMockFile(5000, 'image.webp', 'image/webp')

      const result = validateImageFileBasic(file)

      expect(result.valid).toBe(true)
    })

    it('refuse un type MIME invalide', () => {
      const file = createMockFile(5000, 'document.pdf', 'application/pdf')

      const result = validateImageFileBasic(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Type de fichier non autorisé')
    })

    it('ne vérifie PAS les magic bytes (validation rapide côté client)', () => {
      // La validation basique se base uniquement sur le type MIME
      // Elle ne peut pas détecter un fichier renommé (c'est le rôle de validateImageFile)
      const file = createMockFile(100, 'fake.jpg', 'image/jpeg')

      const result = validateImageFileBasic(file)

      expect(result.valid).toBe(true)
    })
  })
})
