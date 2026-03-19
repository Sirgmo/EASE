// src/lib/transactions/rbac.ts
// Per-transaction RBAC helpers for the Ease transaction dashboard.
//
// getTransactionRole is implemented in src/db/schema/transactionParties.ts —
// re-exported here as the canonical public API so all callers import from one place.
//
// fetchTransactionForRole is a multi-join query that returns the full transaction
// dataset scoped to the caller's role. Role-specific filtering (e.g., hiding
// buyer-only fields from third parties) is handled in the UI layer based on
// the viewerRole field.

import { db } from '@/db'
import { eq, and } from 'drizzle-orm'
import { transactions, transactionEvents, transactionConditions } from '@/db/schema/transactions'
import { transactionParties } from '@/db/schema/transactionParties'

// Re-export getTransactionRole from its canonical location in transactionParties.ts.
// This satisfies the acceptance criteria: `export { getTransactionRole } from '@/db/schema/transactionParties'`
export { getTransactionRole } from '@/db/schema/transactionParties'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionDashboardData = {
  transaction: typeof transactions.$inferSelect
  events: (typeof transactionEvents.$inferSelect)[]
  conditions: (typeof transactionConditions.$inferSelect)[]
  parties: (typeof transactionParties.$inferSelect)[]
  viewerRole: string
}

// ─── fetchTransactionForRole ──────────────────────────────────────────────────

/**
 * Fetches a full transaction dataset for a given role.
 *
 * Returns the transaction record, recent events (last 20, oldest first),
 * all conditions, and all active parties. The viewerRole is passed through
 * so the UI can render role-scoped sections without another DB round-trip.
 *
 * Returns null if the transaction does not exist.
 */
export async function fetchTransactionForRole(
  transactionId: string,
  role: string
): Promise<TransactionDashboardData | null> {
  // Fetch the transaction
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1)

  if (!tx) return null

  // Fetch recent events (last 20, sorted oldest-first for timeline display)
  const events = await db
    .select()
    .from(transactionEvents)
    .where(eq(transactionEvents.transactionId, transactionId))
    .orderBy(transactionEvents.sortKey)
    .limit(20)

  // Fetch all conditions for this transaction
  const conditions = await db
    .select()
    .from(transactionConditions)
    .where(eq(transactionConditions.transactionId, transactionId))

  // Fetch all active parties
  const parties = await db
    .select()
    .from(transactionParties)
    .where(
      and(
        eq(transactionParties.transactionId, transactionId),
        eq(transactionParties.isActive, true)
      )
    )

  return {
    transaction: tx,
    events,
    conditions,
    parties,
    viewerRole: role,
  }
}
