// src/app/(dashboard)/transactions/new/page.tsx
// New transaction page — entry point for starting a transaction on a property
// Flow: /search -> property page -> "Start Transaction" -> this page -> TierSelector -> Stripe -> webhook
// Server component: creates DRAFT transaction then renders TierSelector with real transactionId
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { transactions, transactionEvents } from '@/db/schema/transactions'
import { transactionParties } from '@/db/schema/transactionParties'
import { TierSelector } from '@/components/transaction/TierSelector'
import { eq, and } from 'drizzle-orm'

interface PageProps {
  searchParams: Promise<{ mls?: string; cancelled?: string }>
}

export default async function NewTransactionPage({ searchParams }: PageProps) {
  // Auth gate — redirect to sign-in if not authenticated
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const { mls: mlsNumber, cancelled } = await searchParams

  // Require an MLS number — cannot start a transaction without a property
  if (!mlsNumber) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-secondary-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-secondary-900">Select a Property First</h1>
          <p className="mt-3 text-sm text-secondary-600">
            To start a transaction, you must first select a property from the search results.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-block rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    )
  }

  // Resolve internal user UUID from Clerk ID
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  if (!user) {
    // User account not yet synced from Clerk webhook — unlikely but handled gracefully
    redirect('/sign-in')
  }

  // Check for existing DRAFT transaction for this user + property
  // Avoids creating duplicate transactions if the user navigates back
  const existingDraft = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(eq(transactions.buyerId, user.id), eq(transactions.mlsNumber, mlsNumber), eq(transactions.status, 'DRAFT'))
    )
    .limit(1)

  let transactionId: string

  if (existingDraft[0]) {
    // Reuse the existing DRAFT transaction
    transactionId = existingDraft[0].id
  } else {
    // Create a new DRAFT transaction
    const inserted = await db
      .insert(transactions)
      .values({
        buyerId: user.id,
        mlsNumber,
      })
      .returning({ id: transactions.id })

    const tx = inserted[0]
    if (!tx) {
      throw new Error('Failed to create transaction')
    }

    transactionId = tx.id

    // Assign buyer as transaction party
    await db.insert(transactionParties).values({
      transactionId,
      userId: user.id,
      role: 'buyer',
    })

    // Insert initial audit event (creation — fromStatus is null)
    await db.insert(transactionEvents).values({
      transactionId,
      fromStatus: null,
      toStatus: 'DRAFT',
      actorId: user.id,
      sortKey: 1,
    })
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto bg-secondary-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">Start Your Transaction</h1>
          <p className="mt-2 text-sm text-secondary-600">
            MLS# {mlsNumber} &mdash; Choose a service tier to get started. Your payment is
            processed securely via Stripe.
          </p>

          {cancelled && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Your previous checkout was cancelled. You can select a tier below to try again.
            </div>
          )}
        </div>

        {/* Tier selection */}
        <TierSelector transactionId={transactionId} mlsNumber={mlsNumber} />
      </div>
    </div>
  )
}
