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
  createJob: vi.fn().mockResolvedValue('job-uuid-risk-1'),
  setJobRunning: vi.fn().mockResolvedValue(undefined),
  setJobResult: vi.fn().mockResolvedValue(undefined),
  setJobError: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/env', () => ({
  env: {},
}))

import { createJob } from '@/lib/ai/job-queue'
import { db } from '@/db'

const VALID_PROPERTY_PAYLOAD = {
  mlsNumber: 'C12345678',
  address: '123 Main St, Toronto, ON M5V 1A1',
  listPrice: 1_250_000,
  propertyType: 'Detached',
  neighbourhood: 'Annex',
  daysOnMarket: 12,
}

describe('POST /api/ai/risk-score', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createJob).mockResolvedValue('job-uuid-risk-1')
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-1', aiDataConsent: true }]),
        }),
      }),
    } as never)
  })

  it('returns 202 with a jobId immediately — does not block on Claude', async () => {
    const request = new Request('http://localhost/api/ai/risk-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PROPERTY_PAYLOAD),
    })
    const response = await POST(request)
    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.jobId).toBe('job-uuid-risk-1')
    expect(createJob).toHaveBeenCalledWith('risk-score', expect.objectContaining({
      mlsNumber: 'C12345678',
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

    const request = new Request('http://localhost/api/ai/risk-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PROPERTY_PAYLOAD),
    })
    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)

    const request = new Request('http://localhost/api/ai/risk-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PROPERTY_PAYLOAD),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    const request = new Request('http://localhost/api/ai/risk-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mlsNumber: 'C12345678' }), // missing address, listPrice, etc.
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})

// Zod schema validation tests — pure, no mocking needed
import { RiskScoreOutputSchema } from '@/lib/ai/schemas/risk-score'

describe('RiskScoreOutputSchema', () => {
  const VALID_OUTPUT = {
    score: 72,
    confidenceLow: 65,
    confidenceHigh: 79,
    factors: [
      { name: 'Price vs Assessment', impact: 'negative' as const, explanation: 'List price is 35% above MPAC assessed value' },
    ],
    summary: 'Moderate risk property with above-market pricing and standard age-related concerns',
  }

  it('accepts valid output with a proper confidence interval', () => {
    const result = RiskScoreOutputSchema.safeParse(VALID_OUTPUT)
    expect(result.success).toBe(true)
  })

  it('rejects output where confidenceHigh equals confidenceLow (no interval)', () => {
    const result = RiskScoreOutputSchema.safeParse({
      ...VALID_OUTPUT,
      confidenceLow: 72,
      confidenceHigh: 72, // bare number — same high and low
    })
    expect(result.success).toBe(false)
  })

  it('rejects output where confidenceHigh is less than confidenceLow', () => {
    const result = RiskScoreOutputSchema.safeParse({
      ...VALID_OUTPUT,
      confidenceLow: 80,
      confidenceHigh: 65, // inverted — impossible interval
    })
    expect(result.success).toBe(false)
  })

  it('rejects output where score is outside the confidence interval', () => {
    const result = RiskScoreOutputSchema.safeParse({
      ...VALID_OUTPUT,
      score: 90, // outside [65, 79]
      confidenceLow: 65,
      confidenceHigh: 79,
    })
    expect(result.success).toBe(false)
  })

  it('rejects output with empty factors array', () => {
    const result = RiskScoreOutputSchema.safeParse({ ...VALID_OUTPUT, factors: [] })
    expect(result.success).toBe(false)
  })
})
