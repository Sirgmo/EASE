// src/app/(dashboard)/transactions/[id]/offer/page.tsx
// Offer creation page — server component, auth-gated
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { transactions } from '@/db/schema/transactions'
import { eq } from 'drizzle-orm'
import { OfferForm } from '@/components/transaction/OfferForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OfferPage({ params }: PageProps) {
  // Auth gate — redirect to sign-in if not authenticated
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const { id: transactionId } = await params

  // Fetch transaction to get mlsNumber for display context
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1)

  if (!transaction) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto bg-secondary-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">Create Offer</h1>
          <p className="mt-2 text-sm text-secondary-600">
            Fill in the details below. Your licensed partner will review your offer before it is
            submitted to the listing brokerage.
          </p>
        </div>

        <OfferForm transactionId={transactionId} mlsNumber={transaction.mlsNumber} />
      </div>
    </div>
  )
}
