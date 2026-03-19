'use client'
// src/components/transaction/TierSelector.tsx
// Service tier selection UI — three Stripe payment tiers displayed as cards
// On "Select", POSTs to /api/stripe/checkout, then redirects to Stripe Checkout URL
import { useState } from 'react'

interface TierSelectorProps {
  transactionId: string
  mlsNumber: string
}

interface Tier {
  id: string
  label: string
  price: string
  description: string
  features: string[]
}

const TIERS: Tier[] = [
  {
    id: 'ai_diy',
    label: 'AI DIY',
    price: '$999',
    description: 'AI-powered guidance through every step. You handle all tasks yourself.',
    features: [
      'AI chat assistant',
      'Step-by-step tracker',
      'Document management',
      'Deadline reminders',
    ],
  },
  {
    id: 'ai_coordinator',
    label: 'AI + Coordinator',
    price: '$2,500',
    description: 'Everything in AI DIY, plus a human coordinator to manage your transaction.',
    features: [
      'AI chat assistant',
      'Step-by-step tracker',
      'Document management',
      'Deadline reminders',
      'Dedicated coordinator',
      'Offer review',
      'Professional scheduling',
    ],
  },
  {
    id: 'ai_full_service',
    label: 'AI + Full Service',
    price: '$5,000\u2013$7,500',
    description: 'White-glove service. A licensed professional handles everything.',
    features: [
      'AI chat assistant',
      'Step-by-step tracker',
      'Document management',
      'Deadline reminders',
      'Dedicated coordinator',
      'Offer review',
      'Professional scheduling',
      'Licensed partner',
      'Full negotiation support',
      'Closing coordination',
    ],
  },
]

export function TierSelector({ transactionId, mlsNumber }: TierSelectorProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(tierId: string) {
    setLoadingTier(tierId)
    setError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, tierId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
      }

      const { url } = (await res.json()) as { url: string }
      if (!url) throw new Error('No checkout URL returned')

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoadingTier(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const isLoading = loadingTier === tier.id
          const isAnyLoading = loadingTier !== null

          return (
            <div
              key={tier.id}
              className="flex flex-col rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Tier header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">{tier.label}</h3>
                <p className="mt-1 text-3xl font-bold text-primary-600">{tier.price}</p>
                <p className="mt-2 text-sm text-secondary-600">{tier.description}</p>
              </div>

              {/* Feature list */}
              <ul className="mb-6 flex-1 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-secondary-700">
                    <span className="mt-0.5 text-primary-500" aria-hidden="true">
                      &#10003;
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Select button */}
              <button
                onClick={() => void handleSelect(tier.id)}
                disabled={isAnyLoading}
                className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Redirecting...' : `Select ${tier.label}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* MLS reference for context */}
      <p className="mt-6 text-center text-xs text-secondary-400">
        Property MLS#{mlsNumber} &middot; Transaction ID: {transactionId}
      </p>
    </div>
  )
}
