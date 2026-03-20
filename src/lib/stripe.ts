// src/lib/stripe.ts
// Stripe client singleton — lazy initialization prevents build-time throw when env vars absent.
// Uses process.env directly (not env.ts) — same pattern as CRON_SECRET.
// The Proxy defers `new Stripe()` until the first property access at request time.
import Stripe from 'stripe'

let _stripe: Stripe | undefined

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true })
    }
    return (_stripe as unknown as Record<string | symbol, unknown>)[prop]
  },
})
