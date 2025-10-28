import { describe, it, expect } from 'vitest'
import { validateUsername } from '@/lib/username-generator'

describe('username-generator', () => {
  describe('validateUsername', () => {
    describe('longueur du pseudo', () => {
      it('refuse un pseudo de moins de 5 caractères', () => {
        const result = validateUsername('abc')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Le pseudo doit contenir au moins 5 caractères')
      })

      it('refuse un pseudo de 4 caractères', () => {
        const result = validateUsername('abcd')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Le pseudo doit contenir au moins 5 caractères')
      })

      it('accepte un pseudo de 5 caractères (minimum)', () => {
        const result = validateUsername('abcde')
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('accepte un pseudo de 20 caractères (maximum)', () => {
        const result = validateUsername('a'.repeat(20))
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('refuse un pseudo de plus de 20 caractères', () => {
        const result = validateUsername('a'.repeat(21))
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Le pseudo ne peut pas dépasser 20 caractères')
      })

      it('trim les espaces avant validation', () => {
        const result = validateUsername('  abc  ')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Le pseudo doit contenir au moins 5 caractères')
      })
    })

    describe('caractères autorisés', () => {
      it('accepte les lettres minuscules', () => {
        const result = validateUsername('abcdefgh')
        expect(result.valid).toBe(true)
      })

      it('accepte les lettres majuscules', () => {
        const result = validateUsername('ABCDEFGH')
        expect(result.valid).toBe(true)
      })

      it('accepte les chiffres', () => {
        const result = validateUsername('user12345')
        expect(result.valid).toBe(true)
      })

      it('accepte les underscores', () => {
        const result = validateUsername('user_name_123')
        expect(result.valid).toBe(true)
      })

      it('accepte les tirets', () => {
        const result = validateUsername('user-name-123')
        expect(result.valid).toBe(true)
      })

      it('accepte un mix de tous les caractères valides', () => {
        const result = validateUsername('User_Name-123')
        expect(result.valid).toBe(true)
      })

      it('refuse les espaces', () => {
        const result = validateUsername('user name')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores')
      })

      it('refuse les caractères spéciaux (!, @, #, etc.)', () => {
        const result = validateUsername('user@name')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores')
      })

      it('refuse les accents', () => {
        const result = validateUsername('utilisatëur')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores')
      })

      it('refuse les points', () => {
        const result = validateUsername('user.name')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores')
      })
    })

    describe('premier caractère', () => {
      it('accepte un pseudo commençant par une lettre', () => {
        const result = validateUsername('username')
        expect(result.valid).toBe(true)
      })

      it('accepte un pseudo commençant par un chiffre', () => {
        const result = validateUsername('1username')
        expect(result.valid).toBe(true)
      })

      it('refuse un pseudo commençant par un underscore', () => {
        const result = validateUsername('_username')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Le pseudo doit commencer par une lettre ou un chiffre')
      })

      it('refuse un pseudo commençant par un tiret', () => {
        const result = validateUsername('-username')
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Le pseudo doit commencer par une lettre ou un chiffre')
      })
    })

    describe('cas réels', () => {
      it('accepte un pseudo typique avec chiffres', () => {
        const result = validateUsername('player123')
        expect(result.valid).toBe(true)
      })

      it('accepte un pseudo avec underscores', () => {
        const result = validateUsername('the_player_123')
        expect(result.valid).toBe(true)
      })

      it('accepte un pseudo avec tirets', () => {
        const result = validateUsername('the-player-123')
        expect(result.valid).toBe(true)
      })

      it('accepte un pseudo mixte', () => {
        const result = validateUsername('Player_123-foo')
        expect(result.valid).toBe(true)
      })

      it('refuse un pseudo vide', () => {
        const result = validateUsername('')
        expect(result.valid).toBe(false)
      })

      it('refuse un pseudo avec seulement des espaces', () => {
        const result = validateUsername('     ')
        expect(result.valid).toBe(false)
      })
    })
  })
})
