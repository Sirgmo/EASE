// src/app/api/stripe/webhook.test.ts
// TDD: Wave 0 test stubs for Stripe webhook handler
// Tests idempotency and checkout.session.completed handling
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @/db to avoid real DB connection
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}))

// Mock stripe module — constructEvent is called for signature verification
vi.mock('stripe', () => {
  const mockStripe = vi.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  }))
  mockStripe.default = mockStripe
  return { default: mockStripe }
})

// Mock @/lib/stripe to return a controllable stripe instance
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

// Mock next/headers (used by some Next.js routes)
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}))

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
  })

  it('duplicate stripeSessionId is ignored — returns { received: true } without db.update', async () => {
    const { stripe } = await import('@/lib/stripe')
    const { db } = await import('@/db')
    const { transactions } = await import('@/db/schema/transactions')
    const { eq } = await import('drizzle-orm')

    const sessionId = 'cs_test_duplicate_123'
    const transactionId = 'tx-uuid-123'

    // Stripe returns a valid event
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          metadata: { transactionId, tierId: 'ai_diy' },
        },
      },
    }
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

    // DB select returns a transaction that already has this stripeSessionId
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: transactionId, stripeSessionId: sessionId }]),
    }
    vi.mocked(db.select).mockReturnValue(mockSelect as any)

    const { POST } = await import('./webhook/route')

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
      headers: { 'stripe-signature': 'sig_test' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(body).toEqual({ received: true })
    // db.update must NOT be called for duplicate session
    expect(db.update).not.toHaveBeenCalled()
  })

  it('valid checkout.session.completed with new sessionId — updates serviceTier', async () => {
    const { stripe } = await import('@/lib/stripe')
    const { db } = await import('@/db')

    const sessionId = 'cs_test_new_456'
    const transactionId = 'tx-uuid-456'

    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          metadata: { transactionId, tierId: 'ai_coordinator' },
        },
      },
    }
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any)

    // DB select returns transaction with no stripeSessionId (new payment)
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: transactionId, stripeSessionId: null }]),
    }
    vi.mocked(db.select).mockReturnValue(mockSelect as any)

    // DB update chain
    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(db.update).mockReturnValue(mockUpdate as any)

    // DB insert chain for tierPayments
    const mockInsert = {
      values: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(db.insert).mockReturnValue(mockInsert as any)

    const { POST } = await import('./webhook/route')

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
      headers: { 'stripe-signature': 'sig_test' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(body).toEqual({ received: true })
    // db.update MUST be called for new session
    expect(db.update).toHaveBeenCalled()
  })
})
