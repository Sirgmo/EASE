// src/lib/saved-searches.test.ts
// Wave 0: stubs testing auth gate and idempotency — these tests drive the route implementations
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env module to avoid envSchema.parse(process.env) throwing in test env
vi.mock('@/lib/env', () => ({
  env: {
    REPLIERS_API_KEY: 'test-repliers-key',
    NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.test_mapbox_token',
    UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-upstash-token',
    RESEND_API_KEY: 're_test_key',
    CRON_SECRET: 'a'.repeat(32),
  },
}))

// Mock Clerk auth — tests must not hit real Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// Mock Drizzle db to avoid real DB connections in tests
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => []) })) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => []) })) })),
    delete: vi.fn(() => ({ where: vi.fn() })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
  },
}))

// Set process.env.CRON_SECRET for cron route auth gate test
process.env.CRON_SECRET = 'a'.repeat(64) // 64 hex chars = 32 bytes

describe('POST /api/saved-searches — auth gate', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    // Re-apply mocks after resetModules
    vi.mock('@/lib/env', () => ({
      env: {
        REPLIERS_API_KEY: 'test-repliers-key',
        NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.test_mapbox_token',
        UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-upstash-token',
        RESEND_API_KEY: 're_test_key',
        CRON_SECRET: 'a'.repeat(32),
      },
    }))
    vi.mock('@clerk/nextjs/server', () => ({
      auth: vi.fn().mockResolvedValue({ userId: null }),
    }))
    vi.mock('@/db', () => ({
      db: {
        select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => []) })) })) })),
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => []) })) })),
        delete: vi.fn(() => ({ where: vi.fn() })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
      },
    }))
  })

  it('returns 401 when unauthenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ userId: null })

    // Dynamic import to reset module cache between tests
    const { POST } = await import('../app/api/saved-searches/route')
    const request = new Request('http://localhost/api/saved-searches', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', criteria: { city: 'Toronto' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request as never)
    expect(response.status).toBe(401)
  })
})

describe('POST /api/favourites — auth gate', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.mock('@/lib/env', () => ({
      env: {
        REPLIERS_API_KEY: 'test-repliers-key',
        NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.test_mapbox_token',
        UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-upstash-token',
        RESEND_API_KEY: 're_test_key',
        CRON_SECRET: 'a'.repeat(32),
      },
    }))
    vi.mock('@clerk/nextjs/server', () => ({
      auth: vi.fn().mockResolvedValue({ userId: null }),
    }))
    vi.mock('@/db', () => ({
      db: {
        select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => []) })) })) })),
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => []) })) })),
        delete: vi.fn(() => ({ where: vi.fn() })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
      },
    }))
  })

  it('returns 401 when unauthenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ userId: null })

    const { POST } = await import('../app/api/favourites/route')
    const request = new Request('http://localhost/api/favourites', {
      method: 'POST',
      body: JSON.stringify({ mlsNumber: 'C12345678', address: '123 Test St', listPrice: '800000' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request as never)
    expect(response.status).toBe(401)
  })
})

describe('GET /api/cron/check-saved-searches — CRON_SECRET gate', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'a'.repeat(64)
    vi.mock('@/lib/env', () => ({
      env: {
        REPLIERS_API_KEY: 'test-repliers-key',
        NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.test_mapbox_token',
        UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-upstash-token',
        RESEND_API_KEY: 're_test_key',
        CRON_SECRET: 'a'.repeat(32),
      },
    }))
    vi.mock('@/db', () => ({
      db: {
        select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([])) })) })),
        insert: vi.fn(() => ({ values: vi.fn(() => ({ onConflictDoNothing: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([])) })) })) })),
      },
    }))
    vi.mock('resend', () => {
      const mockSend = vi.fn().mockResolvedValue({ id: 'test-email-id' })
      function MockResend() {
        return { emails: { send: mockSend } }
      }
      return { Resend: MockResend }
    })
    vi.mock('@react-email/components', () => ({
      render: vi.fn().mockResolvedValue('<html>test</html>'),
    }))
    vi.mock('@/lib/repliers', () => ({
      searchListings: vi.fn().mockResolvedValue({ listings: [], count: 0, numFound: 0, page: 1 }),
    }))
  })

  it('returns 401 without CRON_SECRET header', async () => {
    const { GET } = await import('../app/api/cron/check-saved-searches/route')
    const request = new Request('http://localhost/api/cron/check-saved-searches')
    const response = await GET(request as never)
    expect(response.status).toBe(401)
  })

  it('returns 401 with wrong CRON_SECRET', async () => {
    const { GET } = await import('../app/api/cron/check-saved-searches/route')
    const request = new Request('http://localhost/api/cron/check-saved-searches', {
      headers: { authorization: 'Bearer wrong-secret' },
    })
    const response = await GET(request as never)
    expect(response.status).toBe(401)
  })

  it('returns 200 with valid CRON_SECRET', async () => {
    const { GET } = await import('../app/api/cron/check-saved-searches/route')
    const request = new Request('http://localhost/api/cron/check-saved-searches', {
      headers: { authorization: `Bearer ${'a'.repeat(64)}` },
    })
    const response = await GET(request as never)
    expect(response.status).toBe(200)
  })
})
