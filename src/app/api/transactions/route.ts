// src/app/api/transactions/route.ts
// POST /api/transactions — create a new transaction (buyer initiates)
// Auth gate: must be logged in. Creates transaction + party record + initial audit event.

import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { transactions, transactionEvents } from '@/db/schema/transactions'
import { transactionParties } from '@/db/schema/transactionParties'
import { eq } from 'drizzle-orm'

const createTransactionSchema = z.object({
  mlsNumber: z.string().min(1, 'MLS number is required'),
})

export async function POST(request: Request): Promise<Response> {
  // Next.js 16: await headers() is required in route handlers
  await headers()

  // Auth gate — must be authenticated
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createTransactionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { mlsNumber } = parsed.data

  // Resolve internal user.id from Clerk ID
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  if (!user) {
    return Response.json(
      { error: 'User not found — ensure your account is fully set up' },
      { status: 404 }
    )
  }

  // Create the transaction record
  const inserted = await db
    .insert(transactions)
    .values({
      buyerId: user.id,
      mlsNumber,
    })
    .returning()

  const tx = inserted[0]
  if (!tx) {
    return Response.json({ error: 'Failed to create transaction' }, { status: 500 })
  }

  // Assign buyer as the first transaction party
  await db.insert(transactionParties).values({
    transactionId: tx.id,
    userId: user.id,
    role: 'buyer',
  })

  // Insert the initial audit event (creation — fromStatus is null)
  await db.insert(transactionEvents).values({
    transactionId: tx.id,
    fromStatus: null,
    toStatus: 'DRAFT',
    actorId: user.id,
    sortKey: 1,
  })

  return Response.json({ transaction: tx }, { status: 201 })
}
