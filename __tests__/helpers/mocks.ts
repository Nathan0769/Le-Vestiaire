import { vi } from 'vitest'

/**
 * Mock Upstash Redis pour éviter les vraies requêtes pendant les tests
 */
export function mockUpstashRedis() {
  vi.mock('@upstash/ratelimit', () => ({
    Ratelimit: vi.fn().mockImplementation(() => ({
      limit: vi.fn().mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
        pending: Promise.resolve(),
      }),
    })),
  }))
}

/**
 * Mock R2 Storage pour éviter les vraies requêtes pendant les tests
 */
export function mockR2Storage() {
  vi.mock('@/lib/r2-storage', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/r2-storage')>()
    return {
      ...actual,
      uploadToR2: vi.fn().mockResolvedValue(undefined),
      deleteFromR2: vi.fn().mockResolvedValue(undefined),
      downloadFromR2: vi.fn().mockResolvedValue(Buffer.from('fake-image')),
      getR2PresignedUrl: vi.fn().mockResolvedValue('https://test.r2.dev/test.jpg'),
    }
  })
}

/**
 * Mock Next.js headers() pour simuler les requêtes HTTP
 */
export function mockNextHeaders(headers: Record<string, string> = {}) {
  vi.mock('next/headers', () => ({
    headers: vi.fn(() => ({
      get: (name: string) => headers[name] ?? null,
    })),
  }))
}

/**
 * Active tous les mocks par défaut pour les tests d'intégration
 * Note: getCurrentUser doit être mocké individuellement dans chaque test
 */
export function setupDefaultMocks() {
  mockUpstashRedis()
  mockR2Storage()
}
