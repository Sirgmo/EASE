// src/db/schema/transactionParties.ts
// Per-transaction role assignments — queried at request time for RBAC
// Role determines what actions each party can perform on a transaction

import {
  pgTable,
  pgEnum,
  uuid,
  timestamp,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { db } from '@/db'
import { eq, and } from 'drizzle-orm'
import { users } from './users'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const transactionPartyRoleEnum = pgEnum('transaction_party_role', [
  'buyer',
  'seller',
  'lawyer',
  'inspector',
  'coordinator',
  'licensed_partner',
])

// ─── transactionParties ───────────────────────────────────────────────────────

export const transactionParties = pgTable(
  'transaction_parties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id').notNull(),
    // userId references users.id — no .references() to avoid circular import issues
    userId: uuid('user_id').notNull(),
    role: transactionPartyRoleEnum('role').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    // isActive allows soft-removal of parties without deleting audit history
    isActive: boolean('is_active').notNull().default(true),
  },
  (table) => [
    // Unique constraint: a user can only hold each role once per transaction
    uniqueIndex('tx_parties_unique_role_idx').on(
      table.transactionId,
      table.userId,
      table.role
    ),
  ]
)

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionParty = typeof transactionParties.$inferSelect
export type NewTransactionParty = typeof transactionParties.$inferInsert

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the role of a Clerk user within a specific transaction, or null if
 * they are not an active party. Used as the RBAC gate in all transaction API routes.
 *
 * @param transactionId - The UUID of the transaction
 * @param clerkUserId   - The Clerk user ID (user_xxxx) from auth()
 * @returns The party's role string, or null if not found / not active
 */
export async function getTransactionRole(
  transactionId: string,
  clerkUserId: string
): Promise<string | null> {
  // Step 1: Resolve internal user.id from Clerk ID
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkUserId))
    .limit(1)

  if (!user) return null

  // Step 2: Look up active party record for this transaction + user
  const [party] = await db
    .select({ role: transactionParties.role })
    .from(transactionParties)
    .where(
      and(
        eq(transactionParties.transactionId, transactionId),
        eq(transactionParties.userId, user.id),
        eq(transactionParties.isActive, true)
      )
    )
    .limit(1)

  return party?.role ?? null
}
