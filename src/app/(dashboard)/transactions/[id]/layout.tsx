// src/app/(dashboard)/transactions/[id]/layout.tsx
// Persistent layout for all /transactions/[id]/* pages.
// Renders the ProgressTracker at the top of every transaction sub-page.

import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/db'
import { transactions } from '@/db/schema/transactions'
import { getTransactionRole } from '@/db/schema/transactionParties'
import { getStepsForStatus } from '@/lib/transactions/steps'
import { ProgressTracker } from '@/components/transaction/ProgressTracker'
import type { TransactionStatus } from '@/lib/transactions/state-machine'
import { eq } from 'drizzle-orm'

interface TransactionLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function TransactionLayout({ children, params }: TransactionLayoutProps) {
  // Auth gate — Clerk middleware also protects /(dashboard)/*, but we check explicitly
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const { id: transactionId } = await params

  // Fetch transaction from DB
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1)

  if (!transaction) {
    notFound()
  }

  // RBAC gate — user must be an active party on this transaction
  const role = await getTransactionRole(transactionId, userId)
  if (!role) {
    redirect('/dashboard')
  }

  // Compute step states for the current transaction status
  const steps = getStepsForStatus(transaction.status as TransactionStatus)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Persistent progress tracker — shown on every transaction sub-page */}
      <div className="bg-white border-b border-secondary-100 px-4 py-4 lg:px-8">
        <ProgressTracker
          steps={steps}
          isCancelled={transaction.status === 'CANCELLED'}
        />
      </div>

      {/* Sub-page content */}
      <div className="flex flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}
