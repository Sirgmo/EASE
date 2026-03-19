// src/lib/cache.test.ts
// Wave 0: test stubs for Upstash Redis cache helpers
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env module to avoid envSchema.parse(process.env) throwing in test env
vi.mock('@/lib/env', () => ({
  env: {
    UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-upstash-token',
  },
}))

// Shared mock instance for Redis methods — reassigned per test via mockImplementation
const mockGet = vi.fn()
const mockSet = vi.fn()
const mockDel = vi.fn()

// Mock @upstash/redis using a proper class constructor
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(function () {
    return {
      get: mockGet,
      set: mockSet,
      del: mockDel,
    }
  }),
}))

describe('cache helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCached returns null on cache miss', async () => {
    mockGet.mockResolvedValue(null)
    const { getCached } = await import('./cache')
    const result = await getCached('missing-key')
    expect(result).toBeNull()
  })

  it('setCached stores value and getCached retrieves it (mocked)', async () => {
    const stored: Record<string, unknown> = {}
    mockGet.mockImplementation((key: string) => Promise.resolve(stored[key] ?? null))
    mockSet.mockImplementation((key: string, value: unknown) => {
      stored[key] = value
      return Promise.resolve()
    })
    const { getCached, setCached } = await import('./cache')
    await setCached('test-key', { data: 42 }, 900)
    const result = await getCached<{ data: number }>('test-key')
    expect(result?.data).toBe(42)
  })

  it('deleteCached removes key', async () => {
    mockDel.mockResolvedValue(1)
    const { deleteCached } = await import('./cache')
    await deleteCached('test-key')
    expect(mockDel).toHaveBeenCalledWith('test-key')
  })
})
