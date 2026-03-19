// src/app/api/stripe/checkout.test.ts
// TDD: Wave 0 test stubs for Stripe checkout session creation
// Tests invalid tier rejection and valid tier session creation
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/db to avoid real DB connection
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

// Mock @clerk/nextjs/server auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_test_clerk_id' }),
}))

// Mock @/lib/stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}))

describe('POST /api/stripe/checkout', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    // Restore auth mock after resetAllMocks clears it
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test_clerk_id' } as any)
    process.env.STRIPE_PRICE_AI_DIY = 'price_test_ai_diy'
    process.env.STRIPE_PRICE_AI_COORDINATOR = 'price_test_ai_coordinator'
    process.env.STRIPE_PRICE_AI_FULL_SERVICE = 'price_test_ai_full_service'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  it('POST with tierId="invalid_tier" returns 400', async () => {
    const { POST } = await import('./checkout/route')

    const req = new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ transactionId: 'tx-123', tierId: 'invalid_tier' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('POST with tierId="ai_diy" returns session URL', async () => {
    const { stripe } = await import('@/lib/stripe')

    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    } as any)

    const { POST } = await import('./checkout/route')

    const req = new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ transactionId: 'tx-456', tierId: 'ai_diy' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/pay/cs_test_123')
  })
})
