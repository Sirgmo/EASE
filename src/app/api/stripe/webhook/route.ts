// src/app/api/stripe/webhook/route.ts
// POST — Handles Stripe webhook events
// CRITICAL: Uses req.text() not req.json() — Stripe signature verification requires raw body
// Idempotency: duplicate checkout.session.completed events are detected by stripeSessionId check
import { db } from '@/db'
import { transactions } from '@/db/schema/transactions'
import { tierPayments } from '@/db/schema/payments'
import { stripe } from '@/lib/stripe'
import { eq } from 'drizzle-orm'

export async function POST(req: Request): Promise<Response> {
  // Read raw body — MUST use req.text(), NOT req.json()
  // Stripe signature verification requires the exact raw bytes of the payload
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string
      metadata: { transactionId: string; tierId: string } | null
      amount_total: number | null
    }

    const { transactionId, tierId } = session.metadata ?? {}

    if (!transactionId || !tierId) {
      console.error('Stripe webhook: missing metadata', { sessionId: session.id })
      return Response.json({ received: true })
    }

    // Idempotency check: if this session was already processed, skip
    const existing = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))

    if (existing.length > 0 && existing[0]?.stripeSessionId === session.id) {
      // Duplicate delivery — already processed this session
      return Response.json({ received: true })
    }

    // Update transaction: set serviceTier and stripeSessionId
    await db
      .update(transactions)
      .set({
        serviceTier: tierId as 'ai_diy' | 'ai_coordinator' | 'ai_full_service',
        stripeSessionId: session.id,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))

    // Insert audit record in tier_payments
    await db.insert(tierPayments).values({
      transactionId,
      stripeSessionId: session.id,
      tierId,
      amountCents: session.amount_total ?? 0,
      status: 'completed',
    })
  }

  return Response.json({ received: true })
}
