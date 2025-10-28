import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRateLimitIdentifier } from '@/lib/rate-limit'

// Type pour le mock de headers
interface MockHeaders {
  get: (name: string) => string | null
}

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

describe('rate-limit', () => {
  describe('getRateLimitIdentifier', () => {
    beforeEach(() => {
      // Reset les mocks avant chaque test
      vi.clearAllMocks()
    })

    it('retourne user:{id} quand userId est fourni', async () => {
      const userId = 'user-123'

      const identifier = await getRateLimitIdentifier(userId)

      expect(identifier).toBe('user:user-123')
    })

    it('utilise IP quand userId est une string vide (userId falsy)', async () => {
      const { headers } = await import('next/headers')
      const mockHeaders: MockHeaders = {
        get: vi.fn((header: string) => {
          if (header === 'x-forwarded-for') return '192.168.1.200'
          return null
        }),
      }
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>)

      const userId = ''
      const identifier = await getRateLimitIdentifier(userId)

      // String vide est falsy en JS, donc devrait utiliser l'IP
      expect(identifier).toBe('ip:192.168.1.200')
    })

    it('utilise x-forwarded-for quand userId est undefined', async () => {
      const { headers } = await import('next/headers')
      const mockHeaders: MockHeaders = {
        get: vi.fn((header: string) => {
          if (header === 'x-forwarded-for') return '192.168.1.100'
          return null
        }),
      }
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>)

      const identifier = await getRateLimitIdentifier(undefined)

      expect(identifier).toBe('ip:192.168.1.100')
    })

    it('prend la première IP de x-forwarded-for si multiples', async () => {
      const { headers } = await import('next/headers')
      const mockHeaders: MockHeaders = {
        get: vi.fn((header: string) => {
          if (header === 'x-forwarded-for')
            return '192.168.1.100, 10.0.0.1, 172.16.0.1'
          return null
        }),
      }
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>)

      const identifier = await getRateLimitIdentifier(undefined)

      expect(identifier).toBe('ip:192.168.1.100')
    })

    it('utilise x-real-ip en fallback si x-forwarded-for est null', async () => {
      const { headers } = await import('next/headers')
      const mockHeaders: MockHeaders = {
        get: vi.fn((header: string) => {
          if (header === 'x-real-ip') return '10.0.0.50'
          return null
        }),
      }
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>)

      const identifier = await getRateLimitIdentifier(undefined)

      expect(identifier).toBe('ip:10.0.0.50')
    })

    it('utilise 127.0.0.1 si aucun header IP n\'est présent', async () => {
      const { headers } = await import('next/headers')
      const mockHeaders: MockHeaders = {
        get: vi.fn(() => null),
      }
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>)

      const identifier = await getRateLimitIdentifier(undefined)

      expect(identifier).toBe('ip:127.0.0.1')
    })

    it('préfère userId sur les headers IP', async () => {
      const { headers } = await import('next/headers')
      const mockHeaders: MockHeaders = {
        get: vi.fn((header: string) => {
          if (header === 'x-forwarded-for') return '192.168.1.100'
          return null
        }),
      }
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>)

      const identifier = await getRateLimitIdentifier('user-456')

      expect(identifier).toBe('user:user-456')
      // headers().get ne devrait pas être appelé
      expect(mockHeaders.get).not.toHaveBeenCalled()
    })

    it('gère les espaces dans x-forwarded-for', async () => {
      const { headers } = await import('next/headers')
      const mockHeaders: MockHeaders = {
        get: vi.fn((header: string) => {
          if (header === 'x-forwarded-for') return ' 192.168.1.100 '
          return null
        }),
      }
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>)

      const identifier = await getRateLimitIdentifier(undefined)

      // Le trim est fait par split()[0] qui prend avant la virgule
      // mais les espaces autour restent
      expect(identifier).toBe('ip: 192.168.1.100 ')
    })

    it('gère une IP IPv6', async () => {
      const { headers } = await import('next/headers')
      const mockHeaders: MockHeaders = {
        get: vi.fn((header: string) => {
          if (header === 'x-forwarded-for') return '2001:0db8:85a3::8a2e:0370:7334'
          return null
        }),
      }
      vi.mocked(headers).mockResolvedValue(mockHeaders as unknown as Awaited<ReturnType<typeof headers>>)

      const identifier = await getRateLimitIdentifier(undefined)

      expect(identifier).toBe('ip:2001:0db8:85a3::8a2e:0370:7334')
    })
  })
})
