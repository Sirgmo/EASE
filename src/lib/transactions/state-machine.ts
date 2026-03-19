// src/lib/transactions/state-machine.ts
// Pure state machine — no DB dependency
// Defines all valid transitions for the transaction lifecycle

export type TransactionStatus =
  | 'DRAFT'
  | 'OFFER_PENDING'
  | 'OFFER_SUBMITTED'
  | 'OFFER_ACCEPTED'
  | 'CONDITIONS_PENDING'
  | 'CONDITIONS_WAIVED'
  | 'CLOSING'
  | 'CLOSED'
  | 'CANCELLED'

// VALID_TRANSITIONS defines the allowed state changes.
// Terminal states (CLOSED, CANCELLED) have empty arrays.
// CANCELLED is reachable from all non-terminal states except CONDITIONS_WAIVED
// (once conditions are waived, the deal proceeds to closing — cannot be cancelled via this path).
export const VALID_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  DRAFT:              ['OFFER_PENDING', 'CANCELLED'],
  OFFER_PENDING:      ['OFFER_SUBMITTED', 'CANCELLED'],
  OFFER_SUBMITTED:    ['OFFER_ACCEPTED', 'CANCELLED'],
  OFFER_ACCEPTED:     ['CONDITIONS_PENDING', 'CANCELLED'],
  CONDITIONS_PENDING: ['CONDITIONS_WAIVED', 'CANCELLED'],
  CONDITIONS_WAIVED:  ['CLOSING'],
  CLOSING:            ['CLOSED', 'CANCELLED'],
  CLOSED:             [],
  CANCELLED:          [],
}

/**
 * Returns true if transitioning from `from` to `to` is a valid state change.
 * Used by PATCH /api/transactions/[id] before any DB write.
 */
export function isValidTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
