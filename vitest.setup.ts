import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Étendre les matchers Vitest avec jest-dom
expect.extend(matchers)

// Cleanup après chaque test
afterEach(() => {
  cleanup()
})

// Mock des variables d'environnement pour les tests
process.env.NODE_ENV = 'test'
process.env.KV_REST_API_URL = 'http://localhost:8079'
process.env.KV_REST_API_TOKEN = 'test_token'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.BETTER_AUTH_SECRET = 'test_secret_key_for_tests_only'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
