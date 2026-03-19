// src/app/(dashboard)/transactions/[id]/page.tsx
// Transaction detail page — renders the real-time multi-party dashboard.
//
// Auth and RBAC are both checked here:
//   - layout.tsx (03-04) already enforces auth + RBAC for the ProgressTracker,
//     but the page independently fetches the role to pass initialData without
//     exposing all parties' data when the role is not resolved.
//
// The layout renders the ProgressTracker above this page's content.
// This page provides the initialData for TransactionDashboard so the first render
// is server-side (no loading flash), then the client SSE subscription takes over.

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTransactionRole, fetchTransactionForRole } from '@/lib/transactions/rbac'
import { TransactionDashboard } from '@/components/transaction/TransactionDashboard'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TransactionPage({ params }: PageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const { id: transactionId } = await params

  // Resolve the viewer's role — redirect if not a party
  const role = await getTransactionRole(transactionId, userId)
  if (!role) {
    redirect('/dashboard')
  }

  // Fetch initial data server-side to avoid a loading flash on first render
  const initialData = await fetchTransactionForRole(transactionId, role)
  if (!initialData) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-secondary-50">
      <TransactionDashboard
        transactionId={transactionId}
        initialData={initialData}
      />
    </div>
  )
}
