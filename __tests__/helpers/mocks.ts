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
 * Mock Supabase Storage pour éviter les uploads pendant les tests
 */
export function mockSupabaseStorage() {
  vi.mock('@/lib/supabase-admin', () => ({
    supabaseAdmin: {
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({
            data: { path: 'test-path.jpg' },
            error: null,
          }),
          remove: vi.fn().mockResolvedValue({ error: null }),
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: 'https://test.supabase.co/test.jpg' },
          })),
        })),
      },
    },
  }))
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
  mockSupabaseStorage()
}
