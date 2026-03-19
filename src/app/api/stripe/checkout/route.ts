// src/app/api/stripe/checkout/route.ts
// POST — Creates a Stripe Checkout session for service tier selection
// Security: tierId is validated server-side against a known map; the client
// never passes price amounts or price IDs — only the tierId string.
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'

// Server-side only: maps tier IDs to Stripe Price IDs
// Price IDs are sourced from env vars — never from client input
const TIER_PRICE_IDS: Record<string, string> = {
  ai_diy: process.env.STRIPE_PRICE_AI_DIY!,
  ai_coordinator: process.env.STRIPE_PRICE_AI_COORDINATOR!,
  ai_full_service: process.env.STRIPE_PRICE_AI_FULL_SERVICE!,
}

// Human-readable tier metadata (for Stripe session description)
const TIER_LABELS: Record<string, { label: string; amountCents: number }> = {
  ai_diy: { label: 'AI DIY', amountCents: 999_00 },
  ai_coordinator: { label: 'AI + Coordinator', amountCents: 2500_00 },
  ai_full_service: { label: 'AI + Full Service', amountCents: 5000_00 },
}

export async function POST(req: Request): Promise<Response> {
  // Auth gate — must be signed in
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { transactionId?: string; tierId?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { transactionId, tierId } = body

  if (!transactionId || !tierId) {
    return Response.json({ error: 'transactionId and tierId are required' }, { status: 400 })
  }

  // Validate tier ID against the server-side map — 400 if unknown
  if (!TIER_PRICE_IDS[tierId]) {
    return Response.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const priceId = TIER_PRICE_IDS[tierId]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      transactionId,
      tierId,
      clerkUserId: userId,
    },
    success_url: `${appUrl}/transactions/${transactionId}?payment=success`,
    cancel_url: `${appUrl}/transactions/new?mls=&cancelled=true`,
  })

  return Response.json({ url: session.url })
}
