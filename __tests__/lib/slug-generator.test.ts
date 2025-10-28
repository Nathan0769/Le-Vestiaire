import { describe, it, expect } from 'vitest'
import { generateJerseySlug, isSlug } from '@/lib/slug-generator'

describe('slug-generator', () => {
  describe('generateJerseySlug', () => {
    it('génère un slug correct avec type HOME', () => {
      const slug = generateJerseySlug('PSG', 'HOME', '2023/24')
      expect(slug).toBe('maillot-psg-domicile-2023-24')
    })

    it('génère un slug correct avec type AWAY', () => {
      const slug = generateJerseySlug('OM', 'AWAY', '2022/23')
      expect(slug).toBe('maillot-om-exterieur-2022-23')
    })

    it('génère un slug correct avec type THIRD', () => {
      const slug = generateJerseySlug('Lyon', 'THIRD', '2024/25')
      expect(slug).toBe('maillot-lyon-third-2024-25')
    })

    it('génère un slug correct avec type GOALKEEPER', () => {
      const slug = generateJerseySlug('Monaco', 'GOALKEEPER', '2023/24')
      expect(slug).toBe('maillot-monaco-gardien-2023-24')
    })

    it('génère un slug correct avec type SPECIAL', () => {
      const slug = generateJerseySlug('Nice', 'SPECIAL', '2023/24')
      expect(slug).toBe('maillot-nice-special-2023-24')
    })

    it('gère les accents dans le nom du club', () => {
      const slug = generateJerseySlug('Montpellier HSC', 'HOME', '2023/24')
      expect(slug).toBe('maillot-montpellier-hsc-domicile-2023-24')
    })

    it('gère les caractères spéciaux', () => {
      const slug = generateJerseySlug('Saint-Étienne', 'HOME', '2023/24')
      expect(slug).toBe('maillot-saint-etienne-domicile-2023-24')
    })

    it('normalise les espaces multiples en un seul tiret', () => {
      const slug = generateJerseySlug('Paris  SG', 'HOME', '2023/24')
      expect(slug).toBe('maillot-paris-sg-domicile-2023-24')
    })

    it('gère un type inconnu en le mettant en lowercase', () => {
      const slug = generateJerseySlug('PSG', 'CUSTOM', '2023/24')
      expect(slug).toBe('maillot-psg-custom-2023-24')
    })

    it('convertit tout en minuscules', () => {
      const slug = generateJerseySlug('REAL MADRID', 'HOME', '2023/24')
      expect(slug).toBe('maillot-real-madrid-domicile-2023-24')
    })

    it('remplace le slash dans la saison par un tiret', () => {
      const slug = generateJerseySlug('PSG', 'HOME', '2023/24')
      expect(slug).toContain('2023-24')
      expect(slug).not.toContain('/')
    })

    it('supprime les tirets au début et à la fin', () => {
      const slug = generateJerseySlug('-PSG-', 'HOME', '2023/24')
      expect(slug).toBe('maillot-psg-domicile-2023-24')
      expect(slug).not.toMatch(/^-/)
      expect(slug).not.toMatch(/-$/)
    })
  })

  describe('isSlug', () => {
    it('retourne true pour un slug valide avec préfixe maillot', () => {
      expect(isSlug('maillot-psg-domicile-2023-24')).toBe(true)
    })

    it('retourne true pour un slug sans préfixe maillot mais avec 4+ parties', () => {
      expect(isSlug('psg-domicile-2023-24')).toBe(true)
    })

    it('retourne false pour un UUID (25-27 caractères alphanumériques)', () => {
      expect(isSlug('a1b2c3d4e5f6g7h8i9j0k1l2m')).toBe(false)
      expect(isSlug('abc123def456ghi789jkl012m')).toBe(false)
    })

    it('retourne false pour une chaîne sans tirets', () => {
      expect(isSlug('psgdomicile202324')).toBe(false)
    })

    it('retourne false pour moins de 4 parties séparées par tirets', () => {
      expect(isSlug('psg-domicile-2023')).toBe(false)
    })

    it('retourne true pour exactement 4 parties', () => {
      expect(isSlug('psg-domicile-2023-24')).toBe(true)
    })

    it('retourne true pour plus de 4 parties', () => {
      expect(isSlug('maillot-psg-domicile-special-2023-24')).toBe(true)
    })
  })
})
