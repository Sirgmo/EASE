// src/db/schema/transactions.ts
// Transaction lifecycle tables for the Ease offer management engine
// CRITICAL: Uses neon-http driver — db.transaction() is NOT available
// Use optimistic locking (unique sort_key constraint) for concurrency safety

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const transactionStatusEnum = pgEnum('transaction_status', [
  'DRAFT',
  'OFFER_PENDING',
  'OFFER_SUBMITTED',
  'OFFER_ACCEPTED',
  'CONDITIONS_PENDING',
  'CONDITIONS_WAIVED',
  'CLOSING',
  'CLOSED',
  'CANCELLED',
])

export const serviceTierEnum = pgEnum('service_tier', [
  'ai_diy',
  'ai_coordinator',
  'ai_full_service',
])

// ─── transactions ─────────────────────────────────────────────────────────────

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // buyerId references users.id — no .references() to avoid circular imports
    buyerId: uuid('buyer_id').notNull(),
    mlsNumber: text('mls_number').notNull(), // matches property snapshot at time of creation
    status: transactionStatusEnum('status').notNull().default('DRAFT'),
    // serviceTier is nullable — set after Stripe payment is confirmed
    serviceTier: serviceTierEnum('service_tier'),
    // stripeSessionId is nullable — used for Stripe checkout idempotency
    stripeSessionId: text('stripe_session_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('tx_buyer_id_idx').on(table.buyerId),
    index('tx_status_idx').on(table.status),
  ]
)

// ─── transactionEvents (immutable audit log — insert only, never update/delete) ─

export const transactionEvents = pgTable(
  'transaction_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id').notNull(),
    // fromStatus is null for the initial creation event
    fromStatus: transactionStatusEnum('from_status'),
    toStatus: transactionStatusEnum('to_status').notNull(),
    // actorId references users.id — nullable for system-generated events
    actorId: uuid('actor_id'),
    note: text('note'),
    // sortKey is monotonically increasing per transaction.
    // The unique constraint on (transactionId, sortKey) is the concurrency guard —
    // concurrent writes for the same transaction will throw a unique constraint violation.
    sortKey: integer('sort_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('tx_events_transaction_id_idx').on(table.transactionId),
    uniqueIndex('tx_events_sort_key_idx').on(table.transactionId, table.sortKey),
  ]
)

// ─── transactionConditions ────────────────────────────────────────────────────

export const transactionConditions = pgTable('transaction_conditions', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull(),
  // conditionType: 'financing' | 'inspection'
  conditionType: text('condition_type').notNull(),
  // deadlineAt stored as UTC — UI converts to user's local timezone for display
  deadlineAt: timestamp('deadline_at', { withTimezone: true }).notNull(),
  waivedAt: timestamp('waived_at', { withTimezone: true }),
  // Reminder timestamps — set when notification is sent to prevent duplicates
  reminder48hSentAt: timestamp('reminder_48h_sent_at', { withTimezone: true }),
  reminder24hSentAt: timestamp('reminder_24h_sent_at', { withTimezone: true }),
  reminder4hSentAt: timestamp('reminder_4h_sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type TransactionEvent = typeof transactionEvents.$inferSelect
export type NewTransactionEvent = typeof transactionEvents.$inferInsert
export type TransactionCondition = typeof transactionConditions.$inferSelect
export type NewTransactionCondition = typeof transactionConditions.$inferInsert
