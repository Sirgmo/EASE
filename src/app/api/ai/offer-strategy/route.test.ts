import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-1', aiDataConsent: true }]),
        }),
      }),
    }),
  },
}))

vi.mock('@/db/schema/users', () => ({
  users: {},
}))

vi.mock('@/lib/ai/job-queue', () => ({
  createJob: vi.fn().mockResolvedValue('job-uuid-offer-1'),
  setJobRunning: vi.fn().mockResolvedValue(undefined),
  setJobResult: vi.fn().mockResolvedValue(undefined),
  setJobError: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/env', () => ({
  env: {},
}))

import { createJob } from '@/lib/ai/job-queue'
import { db } from '@/db'

const VALID_LISTING = {
  mlsNumber: 'C12345678',
  address: '123 Main St, Toronto, ON M5V 1A1',
  listPrice: 1_250_000,
  propertyType: 'Detached',
  bedrooms: 3,
  bathrooms: 2,
  daysOnMarket: 12,
  neighbourhood: 'Annex',
}

const VALID_COMP = {
  address: '456 Oak Ave, Toronto, ON',
  salePrice: 1_185_000,
  listPrice: 1_199_000,
  soldDate: '2026-02-14',
  bedrooms: 3,
  bathrooms: 2,
  daysOnMarket: 8,
}

describe('POST /api/ai/offer-strategy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createJob).mockResolvedValue('job-uuid-offer-1')
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-1', aiDataConsent: true }]),
        }),
      }),
    } as never)
  })

  it('returns 202 with jobId immediately — does not block on Claude', async () => {
    const request = new Request('http://localhost/api/ai/offer-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing: VALID_LISTING, comparableSales: [VALID_COMP] }),
    })
    const response = await POST(request)
    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.jobId).toBe('job-uuid-offer-1')
    expect(createJob).toHaveBeenCalledWith('offer-strategy', expect.objectContaining({
      listing: expect.objectContaining({ mlsNumber: 'C12345678' }),
    }))
  })

  it('returns 403 when user has not given AI data consent', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-1', aiDataConsent: false }]),
        }),
      }),
    } as never)

    const request = new Request('http://localhost/api/ai/offer-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing: VALID_LISTING, comparableSales: [VALID_COMP] }),
    })
    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)

    const request = new Request('http://localhost/api/ai/offer-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing: VALID_LISTING, comparableSales: [VALID_COMP] }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 400 when comparableSales array is missing', async () => {
    const request = new Request('http://localhost/api/ai/offer-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing: VALID_LISTING }), // missing comparableSales
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when listing is missing required fields', async () => {
    const request = new Request('http://localhost/api/ai/offer-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing: { mlsNumber: 'C12345' }, comparableSales: [] }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})

// Zod schema validation tests
import { OfferStrategyOutputSchema } from '@/lib/ai/schemas/offer-strategy'

describe('OfferStrategyOutputSchema', () => {
  const VALID_OUTPUT = {
    priceRangeLow: 1_180_000,
    priceRangeHigh: 1_230_000,
    saleToListRatio: 0.98,
    negotiationContext: 'Property has been on market 12 days — sellers may be motivated. No competing offers reported.',
    recommendedConditions: ['financing', 'home inspection'],
    comparableSalesSummary: 'Three comparable detached homes in the Annex sold between $1.15M and $1.23M over the last 90 days.',
    confidenceNote: 'Moderate confidence — limited comparables in immediate street.',
  }

  it('accepts valid output with a proper price range', () => {
    const result = OfferStrategyOutputSchema.safeParse(VALID_OUTPUT)
    expect(result.success).toBe(true)
  })

  it('rejects output where priceRangeHigh equals priceRangeLow (single price)', () => {
    const result = OfferStrategyOutputSchema.safeParse({
      ...VALID_OUTPUT,
      priceRangeLow: 1_200_000,
      priceRangeHigh: 1_200_000, // same value = single price
    })
    expect(result.success).toBe(false)
  })

  it('rejects output where priceRangeHigh is less than priceRangeLow', () => {
    const result = OfferStrategyOutputSchema.safeParse({
      ...VALID_OUTPUT,
      priceRangeLow: 1_250_000,
      priceRangeHigh: 1_180_000, // inverted
    })
    expect(result.success).toBe(false)
  })

  it('rejects output with empty recommendedConditions', () => {
    const result = OfferStrategyOutputSchema.safeParse({
      ...VALID_OUTPUT,
      recommendedConditions: [], // must have at least one condition
    })
    expect(result.success).toBe(false)
  })

  it('rejects output with saleToListRatio outside plausible range', () => {
    const result = OfferStrategyOutputSchema.safeParse({
      ...VALID_OUTPUT,
      saleToListRatio: 2.5, // 250% of list price — impossible
    })
    expect(result.success).toBe(false)
  })
})
