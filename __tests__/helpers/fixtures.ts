import { prismaTest } from './db'
import type { User, League, Club, Jersey } from '@prisma/client'

/**
 * Crée un utilisateur de test avec des données par défaut
 */
export async function createTestUser(
  overrides?: Partial<User>
): Promise<User> {
  return prismaTest.user.create({
    data: {
      email: overrides?.email ?? `test-${Date.now()}@example.com`,
      name: overrides?.name ?? 'Test User',
      emailVerified: overrides?.emailVerified ?? true,
      image: overrides?.image ?? null,
      favoriteClubId: overrides?.favoriteClubId ?? null,
      leaderboardAnonymous: overrides?.leaderboardAnonymous ?? false,
      ...overrides,
    },
  })
}

/**
 * Crée une ligue de test
 */
export async function createTestLeague(
  overrides?: Partial<League>
): Promise<League> {
  return prismaTest.league.create({
    data: {
      name: overrides?.name ?? `Test League ${Date.now()}`,
      country: overrides?.country ?? 'France',
      logoUrl: overrides?.logoUrl ?? 'https://example.com/logo.png',
      tier: overrides?.tier ?? 1,
      ...overrides,
    },
  })
}

/**
 * Crée un club de test
 */
export async function createTestClub(
  leagueId: string,
  overrides?: Partial<Club>
): Promise<Club> {
  return prismaTest.club.create({
    data: {
      name: overrides?.name ?? `Test Club ${Date.now()}`,
      shortName: overrides?.shortName ?? 'TC',
      logoUrl: overrides?.logoUrl ?? 'https://example.com/club.png',
      primaryColor: overrides?.primaryColor ?? '#000000',
      leagueId,
      ...overrides,
    },
  })
}

/**
 * Crée un maillot de test
 */
export async function createTestJersey(
  clubId: string,
  overrides?: Partial<Jersey>
): Promise<Jersey> {
  return prismaTest.jersey.create({
    data: {
      name: overrides?.name ?? `Test Jersey ${Date.now()}`,
      season: overrides?.season ?? '2024/25',
      type: overrides?.type ?? 'HOME',
      brand: overrides?.brand ?? 'Nike',
      imageUrl: overrides?.imageUrl ?? 'https://example.com/jersey.png',
      retailPrice: overrides?.retailPrice ?? 90,
      clubId,
      description: overrides?.description ?? null,
      ...overrides,
    },
  })
}

/**
 * Crée une session de test pour un utilisateur
 */
export async function createTestSession(userId: string, token?: string) {
  const sessionToken = token ?? `test-session-${Date.now()}`

  return prismaTest.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      token: sessionToken,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    },
  })
}

/**
 * Setup complet : League → Club → Jersey
 */
export async function createTestSetup() {
  const league = await createTestLeague({ name: 'Ligue 1' })
  const club = await createTestClub(league.id, { name: 'PSG' })
  const jersey = await createTestJersey(club.id, {
    name: 'Maillot PSG Domicile 2024/25',
    season: '2024/25',
    type: 'HOME',
  })

  return { league, club, jersey }
}
