'use client'

// src/components/transaction/TransactionDashboard.tsx
// Multi-party real-time transaction dashboard.
//
// Subscribes to /api/transactions/[id]/stream via EventSource for live updates.
// Renders role-scoped sections: status overview, timeline, conditions & deadlines,
// and parties list. Dates are displayed in America/Toronto timezone.
//
// TransactionDashboardData is imported from rbac.ts (single source of truth).
// Date fields are Date objects when coming from the server, and string when
// coming from SSE (JSON-serialized). The helper functions handle both cases.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { TransactionDashboardData } from '@/lib/transactions/rbac'

export type { TransactionDashboardData }

interface TransactionDashboardProps {
  transactionId: string
  initialData: TransactionDashboardData
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TORONTO_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const TORONTO_DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatDateTime(date: Date | string): string {
  try {
    return TORONTO_FMT.format(new Date(date))
  } catch {
    return String(date)
  }
}

function formatDate(date: Date | string): string {
  try {
    return TORONTO_DATE_FMT.format(new Date(date))
  } catch {
    return String(date)
  }
}

/** Returns days until deadline (negative = past) */
function daysUntil(date: Date | string): number {
  const now = Date.now()
  const deadline = new Date(date).getTime()
  return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'bg-secondary-100 text-secondary-700'
    case 'OFFER_PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'OFFER_SUBMITTED':
      return 'bg-blue-100 text-blue-800'
    case 'OFFER_ACCEPTED':
      return 'bg-green-100 text-green-800'
    case 'CONDITIONS_PENDING':
      return 'bg-orange-100 text-orange-800'
    case 'CONDITIONS_WAIVED':
      return 'bg-teal-100 text-teal-800'
    case 'CLOSING':
      return 'bg-indigo-100 text-indigo-800'
    case 'CLOSED':
      return 'bg-green-200 text-green-900'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-secondary-100 text-secondary-700'
  }
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TransactionDashboard({ transactionId, initialData }: TransactionDashboardProps) {
  const [data, setData] = useState<TransactionDashboardData>(initialData)

  // SSE subscription — connect to /api/transactions/[id]/stream for real-time updates
  useEffect(() => {
    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      es = new EventSource(`/api/transactions/${transactionId}/stream`)

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type: string } & Partial<TransactionDashboardData>
          const { type, ...rest } = payload
          if ((type === 'init' || type === 'update') && rest.transaction) {
            setData(rest as TransactionDashboardData)
          }
        } catch {
          // Malformed SSE message — ignore and wait for next
        }
      }

      es.onerror = () => {
        es?.close()
        es = null
        // Reconnect after 3 seconds if EventSource itself doesn't auto-reconnect
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      es?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [transactionId])

  const { transaction, events, conditions, parties, viewerRole } = data

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-secondary-500">MLS# {transaction.mlsNumber}</p>
          <h1 className="mt-1 text-2xl font-bold text-secondary-900">Transaction Dashboard</h1>
        </div>
        <span
          className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(transaction.status)}`}
        >
          {transaction.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* ── Two-column grid on large screens ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ── Card: Status Overview ── */}
        <div className="rounded-xl border border-secondary-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-500">
            Status Overview
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary-500">Status</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(transaction.status)}`}
              >
                {transaction.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-500">Service Tier</span>
              <span className="font-medium text-secondary-800 capitalize">
                {transaction.serviceTier ? transaction.serviceTier.replace(/_/g, ' ') : 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-500">MLS Number</span>
              <span className="font-mono text-secondary-700">{transaction.mlsNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-500">Last Updated</span>
              <span className="text-secondary-700">{formatDate(transaction.updatedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-500">Your Role</span>
              <span className="font-semibold text-indigo-700">{formatRole(viewerRole)}</span>
            </div>
          </div>

          {/* ── Buyer CTA: Create Offer ── */}
          {viewerRole === 'buyer' && transaction.status === 'OFFER_PENDING' && (
            <div className="mt-5">
              <Link
                href={`/transactions/${transactionId}/offer`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Create Offer
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          )}

          {/* ── Seller placeholder ── */}
          {viewerRole === 'seller' && (
            <div className="mt-5 rounded-lg border border-secondary-100 bg-secondary-50 px-3 py-2 text-sm text-secondary-600">
              Offers Received — available in Phase 6.
            </div>
          )}

          {/* ── Lawyer placeholder ── */}
          {viewerRole === 'lawyer' && (
            <div className="mt-5 rounded-lg border border-secondary-100 bg-secondary-50 px-3 py-2 text-sm text-secondary-600">
              Documents section — available in Phase 4 (DocuSign integration).
            </div>
          )}
        </div>

        {/* ── Card: Parties ── */}
        <div className="rounded-xl border border-secondary-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-500">
            Transaction Parties
          </h2>
          {parties.length === 0 ? (
            <p className="mt-3 text-sm text-secondary-400">No parties on this transaction yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-secondary-50">
              {parties.map((party, i) => (
                <li key={i} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-secondary-700">{formatRole(party.role)}</span>
                  <span className="rounded-full bg-secondary-100 px-2 py-0.5 font-mono text-xs text-secondary-500">
                    {party.userId.slice(0, 8)}…
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Card: Timeline (events) ── */}
        <div className="rounded-xl border border-secondary-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-500">
            Timeline
          </h2>
          {events.length === 0 ? (
            <p className="mt-3 text-sm text-secondary-400">No events recorded yet.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {events.map((event, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  {/* Timeline dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-secondary-800">
                      {event.fromStatus
                        ? `${event.fromStatus.replace(/_/g, ' ')} → ${event.toStatus.replace(/_/g, ' ')}`
                        : `Transaction created (${event.toStatus.replace(/_/g, ' ')})`}
                    </p>
                    {event.note && (
                      <p className="mt-0.5 text-secondary-500">{event.note}</p>
                    )}
                    <p className="mt-0.5 text-xs text-secondary-400">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ── Card: Conditions & Deadlines ── */}
        <div className="rounded-xl border border-secondary-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-500">
            Conditions &amp; Deadlines
          </h2>
          {conditions.length === 0 ? (
            <p className="mt-3 text-sm text-secondary-400">No conditions on this transaction.</p>
          ) : (
            <ul className="mt-3 divide-y divide-secondary-50">
              {conditions.map((cond, i) => {
                const days = daysUntil(cond.deadlineAt)
                const isWaived = !!cond.waivedAt
                const isPast = !isWaived && days < 0
                const isUrgent = !isWaived && days >= 0 && days <= 2

                return (
                  <li key={i} className="py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium capitalize text-secondary-800">
                          {cond.conditionType.replace(/_/g, ' ')} condition
                        </p>
                        <p className="mt-0.5 text-xs text-secondary-500">
                          Deadline: {formatDate(cond.deadlineAt)} (America/Toronto)
                        </p>
                        {!isWaived && (
                          <p
                            className={`mt-0.5 text-xs font-medium ${
                              isPast
                                ? 'text-red-600'
                                : isUrgent
                                ? 'text-orange-600'
                                : 'text-secondary-500'
                            }`}
                          >
                            {isPast
                              ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
                              : days === 0
                              ? 'Due today'
                              : `${days} day${days === 1 ? '' : 's'} remaining`}
                          </p>
                        )}
                      </div>
                      <div>
                        {isWaived ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                            Waived
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isPast
                                ? 'bg-red-100 text-red-800'
                                : isUrgent
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DocuSign gate — condition waiver requires a signed document (Phase 4) */}
                    {!isWaived && (
                      <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Condition waiver requires a signed document — available in Phase 4 (DocuSign integration).
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>

      {/* ── Back link ── */}
      <div className="mt-6">
        <Link
          href="/dashboard"
          className="text-sm text-secondary-500 transition-colors hover:text-secondary-700"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
