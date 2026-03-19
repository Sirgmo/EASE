// src/db/schema/payments.ts
// tier_payments — tracks Stripe Checkout sessions for audit and idempotency
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const tierPayments = pgTable('tier_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  // transactionId references transactions.id — no .references() to avoid circular imports
  transactionId: uuid('transaction_id').notNull(),
  stripeSessionId: text('stripe_session_id').notNull().unique(),
  tierId: text('tier_id').notNull(), // 'ai_diy' | 'ai_coordinator' | 'ai_full_service'
  amountCents: integer('amount_cents').notNull(),
  status: text('status').notNull().default('pending'), // pending | completed | failed
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type TierPayment = typeof tierPayments.$inferSelect
export type NewTierPayment = typeof tierPayments.$inferInsert
