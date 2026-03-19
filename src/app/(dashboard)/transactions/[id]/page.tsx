// src/app/(dashboard)/transactions/[id]/page.tsx
// Transaction dashboard/overview page — shown after layout renders the progress tracker.
// The layout handles auth + RBAC, so this page can focus on content.

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { transactions } from '@/db/schema/transactions'
import { eq } from 'drizzle-orm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TransactionPage({ params }: PageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const { id: transactionId } = await params

  // Fetch transaction for display context
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1)

  if (!transaction) {
    redirect('/dashboard')
  }

  // Determine the next action URL based on transaction status
  const getNextActionHref = () => {
    switch (transaction.status) {
      case 'DRAFT':
        return `/transactions/new?mls=${transaction.mlsNumber}`
      case 'OFFER_PENDING':
        return `/transactions/${transactionId}/offer`
      default:
        return null
    }
  }

  const nextActionHref = getNextActionHref()

  return (
    <div className="flex flex-col flex-1 overflow-y-auto bg-secondary-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <p className="text-sm text-secondary-500">MLS# {transaction.mlsNumber}</p>
          <h1 className="text-2xl font-bold text-secondary-900 mt-1">Transaction Overview</h1>
          <p className="mt-2 text-sm text-secondary-600">
            Status: <span className="font-medium text-secondary-800">{transaction.status.replace(/_/g, ' ')}</span>
          </p>
        </div>

        {/* Status card */}
        <div className="rounded-xl border border-secondary-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-secondary-500 uppercase tracking-wide">Current Status</h2>
          <p className="mt-2 text-lg font-semibold text-secondary-900">
            {transaction.status === 'DRAFT' && 'Select a service tier to begin your offer.'}
            {transaction.status === 'OFFER_PENDING' && 'Your offer is ready to be filled out.'}
            {transaction.status === 'OFFER_SUBMITTED' && 'Your offer has been submitted for partner review.'}
            {transaction.status === 'OFFER_ACCEPTED' && 'Congratulations — your offer was accepted! Negotiation is underway.'}
            {transaction.status === 'CONDITIONS_PENDING' && 'Your offer is accepted. Complete your financing and inspection conditions.'}
            {transaction.status === 'CONDITIONS_WAIVED' && 'Conditions waived — proceeding to closing.'}
            {transaction.status === 'CLOSING' && 'Closing is in progress. Final documents and funds are being arranged.'}
            {transaction.status === 'CLOSED' && 'Transaction complete — congratulations on your new home!'}
            {transaction.status === 'CANCELLED' && 'This transaction has been cancelled.'}
          </p>

          {/* Service tier badge (if set) */}
          {transaction.serviceTier && (
            <p className="mt-3 text-sm text-secondary-500">
              Service tier:{' '}
              <span className="font-medium text-secondary-700 capitalize">
                {transaction.serviceTier.replace(/_/g, ' ')}
              </span>
            </p>
          )}

          {/* Next action CTA */}
          {nextActionHref && (
            <div className="mt-6">
              <Link
                href={nextActionHref}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                {transaction.status === 'DRAFT' && 'Choose Service Tier'}
                {transaction.status === 'OFFER_PENDING' && 'Create Offer'}
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="mt-4 rounded-xl border border-secondary-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-secondary-500 uppercase tracking-wide">Details</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-secondary-500">MLS Number</dt>
              <dd className="font-medium text-secondary-900">{transaction.mlsNumber}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">Transaction ID</dt>
              <dd className="font-mono text-xs text-secondary-500">{transactionId}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">Created</dt>
              <dd className="text-secondary-700">
                {new Date(transaction.createdAt).toLocaleDateString('en-CA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-secondary-500">Last Updated</dt>
              <dd className="text-secondary-700">
                {new Date(transaction.updatedAt).toLocaleDateString('en-CA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>

        {/* Back link */}
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="text-sm text-secondary-500 hover:text-secondary-700 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
