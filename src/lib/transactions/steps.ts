// src/lib/transactions/steps.ts
// Step definitions for the buyer transaction journey UI
// Maps each transaction status to a visual step indicator state

import type { TransactionStatus } from './state-machine'

export interface TransactionStep {
  id: string
  label: string
  description: string
  status: 'completed' | 'current' | 'upcoming'
}

// BUYER_STEPS defines the ordered steps shown in the buyer dashboard.
// Each step is "active" when the transaction is in one of the listed statuses.
export const BUYER_STEPS: Array<{
  id: string
  label: string
  description: string
  activeAt: TransactionStatus[]
}> = [
  {
    id: 'start',
    label: 'Select Service Tier',
    description: 'Choose how much support you want',
    activeAt: ['DRAFT'],
  },
  {
    id: 'offer',
    label: 'Create Offer',
    description: 'Set price, conditions, and dates',
    activeAt: ['OFFER_PENDING'],
  },
  {
    id: 'review',
    label: 'Partner Review',
    description: 'Licensed partner reviews your offer',
    activeAt: ['OFFER_SUBMITTED'],
  },
  {
    id: 'negotiate',
    label: 'Negotiation',
    description: 'Offer submitted — awaiting response',
    activeAt: ['OFFER_ACCEPTED'],
  },
  {
    id: 'conditions',
    label: 'Satisfy Conditions',
    description: 'Financing and inspection period',
    activeAt: ['CONDITIONS_PENDING'],
  },
  {
    id: 'waiver',
    label: 'Waive Conditions',
    description: 'Sign condition waivers',
    activeAt: ['CONDITIONS_WAIVED'],
  },
  {
    id: 'closing',
    label: 'Closing',
    description: 'Final documents and funds',
    activeAt: ['CLOSING'],
  },
  {
    id: 'done',
    label: 'Closed',
    description: 'Congratulations!',
    activeAt: ['CLOSED'],
  },
]

/**
 * Returns the buyer steps with correct completed/current/upcoming status
 * for the given transaction status.
 * Steps before the current step are 'completed', the active step is 'current',
 * and steps after are 'upcoming'.
 */
export function getStepsForStatus(currentStatus: TransactionStatus): TransactionStep[] {
  const currentIndex = BUYER_STEPS.findIndex((s) => s.activeAt.includes(currentStatus))
  return BUYER_STEPS.map((step, i) => ({
    id: step.id,
    label: step.label,
    description: step.description,
    status: i < currentIndex ? 'completed' : i === currentIndex ? 'current' : 'upcoming',
  }))
}
