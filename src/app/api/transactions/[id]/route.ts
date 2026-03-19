// src/app/api/transactions/[id]/route.ts
// GET  /api/transactions/[id] — fetch transaction + events + caller's role
// PATCH /api/transactions/[id] — transition transaction state
//
// RBAC: caller must be an active party (getTransactionRole returns non-null)
// Concurrency: optimistic locking via unique (transactionId, sortKey) constraint
// No db.transaction() — neon-http driver does not support it

import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { transactions, transactionEvents } from '@/db/schema/transactions'
import { getTransactionRole } from '@/db/schema/transactionParties'
import { isValidTransition } from '@/lib/transactions/state-machine'
import type { TransactionStatus } from '@/lib/transactions/state-machine'
import { eq, desc, max } from 'drizzle-orm'

const patchTransactionSchema = z.object({
  toStatus: z.string().min(1, 'toStatus is required'),
  note: z.string().optional(),
})

// ─── GET /api/transactions/[id] ───────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  // Next.js 16: await headers() is required
  await headers()

  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { id } = await params

  // RBAC: caller must be a party to this transaction
  const role = await getTransactionRole(id, userId)
  if (!role) {
    return Response.json({ error: 'Forbidden — not a party to this transaction' }, { status: 403 })
  }

  // Fetch the transaction
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!transaction) {
    return Response.json({ error: 'Transaction not found' }, { status: 404 })
  }

  // Fetch recent audit events (most recent first)
  const events = await db
    .select()
    .from(transactionEvents)
    .where(eq(transactionEvents.transactionId, id))
    .orderBy(desc(transactionEvents.sortKey))

  return Response.json({ transaction, events, role })
}

// ─── PATCH /api/transactions/[id] ─────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  // Next.js 16: await headers() is required
  await headers()

  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { id } = await params

  // RBAC: caller must be a party to this transaction
  const role = await getTransactionRole(id, userId)
  if (!role) {
    return Response.json({ error: 'Forbidden — not a party to this transaction' }, { status: 403 })
  }

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = patchTransactionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { toStatus, note } = parsed.data

  // Fetch the current transaction
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!transaction) {
    return Response.json({ error: 'Transaction not found' }, { status: 404 })
  }

  const currentStatus = transaction.status as TransactionStatus
  const nextStatus = toStatus as TransactionStatus

  // Validate state transition via state machine
  if (!isValidTransition(currentStatus, nextStatus)) {
    return Response.json(
      {
        error: 'Invalid transition',
        from: currentStatus,
        to: nextStatus,
      },
      { status: 422 }
    )
  }

  // Resolve internal user.id for the actor
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Get the current max sortKey for this transaction (for optimistic locking)
  const [maxResult] = await db
    .select({ maxSortKey: max(transactionEvents.sortKey) })
    .from(transactionEvents)
    .where(eq(transactionEvents.transactionId, id))

  const nextSortKey = (maxResult?.maxSortKey ?? 0) + 1

  // Update the transaction status
  const [updatedTransaction] = await db
    .update(transactions)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, id))
    .returning()

  // Insert the audit event — unique constraint on (transactionId, sortKey) guards against
  // concurrent modifications: if two requests race, only one will succeed.
  try {
    await db.insert(transactionEvents).values({
      transactionId: id,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      actorId: user.id,
      note: note ?? null,
      sortKey: nextSortKey,
    })
  } catch (err) {
    // Unique constraint violation on (transactionId, sortKey) = concurrent modification
    const error = err as { code?: string; message?: string }
    if (
      error.code === '23505' ||
      error.message?.includes('unique') ||
      error.message?.includes('duplicate')
    ) {
      return Response.json(
        { error: 'Concurrent modification — retry' },
        { status: 409 }
      )
    }
    throw err
  }

  return Response.json({ transaction: updatedTransaction })
}
