// src/lib/repliers.test.ts
// Wave 0: test stubs for Repliers API client
// Mock env and @upstash/redis to avoid module-load side effects in test environment
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env module to avoid envSchema.parse(process.env) throwing in test env
vi.mock('@/lib/env', () => ({
  env: {
    REPLIERS_API_KEY: 'test-repliers-key',
    NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.test_mapbox_token',
    UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-upstash-token',
  },
}))

// Minimal inline type matching RepliersListing shape for tests
type MockListing = {
  mlsNumber: string
  status: 'A'
  listPrice: number
  listingBrokerage: string
  map: { latitude: number; longitude: number }
}

const MOCK_LISTING: MockListing = {
  mlsNumber: 'C12345678',
  status: 'A',
  listPrice: 899000,
  listingBrokerage: 'Royal LePage',
  map: { latitude: 43.6532, longitude: -79.3832 },
}

describe('repliers client', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Override global fetch so tests never hit real Repliers API
    global.fetch = vi.fn()
  })

  it('searchListings: returns listings array from mocked Repliers response', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 1, numFound: 1, page: 1, listings: [MOCK_LISTING] }),
    })
    // Dynamically import to avoid env.ts parse at module load
    const { searchListings } = await import('./repliers')
    const params = new URLSearchParams({ city: 'Toronto', status: 'A' })
    const result = await searchListings(params)
    expect(result.listings).toHaveLength(1)
    expect(result.listings[0]?.mlsNumber).toBe('C12345678')
  })

  it('searchListings: fetch is called with REPLIERS-API-KEY header (key never returned to caller)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 0, numFound: 0, page: 1, listings: [] }),
    })
    const { searchListings } = await import('./repliers')
    await searchListings(new URLSearchParams())
    const firstCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const options = firstCall?.[1] as { headers: Record<string, string> }
    expect(options?.headers['REPLIERS-API-KEY']).toBeDefined()
    expect(options?.headers['REPLIERS-API-KEY']).not.toBe('')
  })

  it('getListing: returns single listing by mlsNumber', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_LISTING,
    })
    const { getListing } = await import('./repliers')
    const result = await getListing('C12345678')
    expect(result.mlsNumber).toBe('C12345678')
  })

  it('getListing: throws on non-200 response', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
    })
    const { getListing } = await import('./repliers')
    await expect(getListing('NOTFOUND')).rejects.toThrow('Repliers detail failed: 404')
  })

  it('getAddressHistory: returns history array', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ listPrice: 850000, listDate: '2023-01-01' }],
    })
    const { getAddressHistory } = await import('./repliers')
    const result = await getAddressHistory('C12345678')
    expect(Array.isArray(result)).toBe(true)
  })
})
