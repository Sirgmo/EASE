// src/lib/stripe.ts
// Stripe client singleton
// Uses process.env directly (not env.ts) to avoid Zod parse blocking cold-start
// when STRIPE_SECRET_KEY is absent in test environments (same pattern as CRON_SECRET)
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})
