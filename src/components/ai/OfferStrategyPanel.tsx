'use client'

import { useEffect, useState, useCallback } from 'react'

interface ComparableSale {
  address: string
  salePrice: number
  listPrice: number
  soldDate: string
  bedrooms: number
  bathrooms: number
  daysOnMarket: number
}

interface OfferStrategyResult {
  priceRangeLow: number
  priceRangeHigh: number
  saleToListRatio: number
  negotiationContext: string
  recommendedConditions: string[]
  comparableSalesSummary: string
  confidenceNote: string
}

type JobStatus = 'idle' | 'pending' | 'running' | 'complete' | 'failed'

interface OfferStrategyPanelProps {
  mlsNumber: string
  address: string
  listPrice: number
  propertyType: string
  bedrooms: number
  bathrooms: number
  squareFootage?: number
  daysOnMarket: number
  neighbourhood: string
  comparableSales: ComparableSale[]
}

const POLL_INTERVAL_MS = 3000

function formatCAD(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function OfferStrategyPanel(props: OfferStrategyPanelProps) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<JobStatus>('idle')
  const [result, setResult] = useState<OfferStrategyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startJob = useCallback(async () => {
    setStatus('pending')
    setError(null)
    setResult(null)

    const { comparableSales, ...listing } = props

    const res = await fetch('/api/ai/offer-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing, comparableSales }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to start offer strategy analysis')
      setStatus('failed')
      return
    }

    const { jobId: newJobId } = await res.json()
    setJobId(newJobId)
  }, [props])

  useEffect(() => {
    if (!jobId || status === 'complete' || status === 'failed') return

    const interval = setInterval(async () => {
      const res = await fetch(`/api/ai/jobs/${jobId}`)
      if (!res.ok) return

      const data = await res.json()
      setStatus(data.status as JobStatus)

      if (data.status === 'complete' && data.result) {
        setResult(data.result as OfferStrategyResult)
        clearInterval(interval)
      } else if (data.status === 'failed') {
        setError('Offer strategy analysis failed. Please try again.')
        clearInterval(interval)
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [jobId, status])

  const isLoading = status === 'pending' || status === 'running'

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Offer Strategy</h3>
        {status === 'idle' && (
          <button
            onClick={startJob}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Get Strategy
          </button>
        )}
      </div>

      {status === 'idle' && (
        <p className="text-sm text-gray-500">
          Get an AI-generated price range and negotiation strategy based on comparable sales.
          {props.comparableSales.length === 0 && (
            <span className="block mt-1 text-amber-600 text-xs">
              No comparables loaded — strategy will use list price as reference only.
            </span>
          )}
        </p>
      )}

      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm text-gray-600">
              {status === 'pending' ? 'Queuing analysis...' : 'Analysing comparable sales...'}
            </span>
          </div>
          <p className="text-xs text-gray-400">Typically 10–25 seconds</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Price range — always shown as a range, never a single number */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
              Recommended Offer Range
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCAD(result.priceRangeLow)}
              <span className="text-blue-500 mx-2">—</span>
              {formatCAD(result.priceRangeHigh)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Sale-to-list ratio from comps: {(result.saleToListRatio * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1 italic">{result.confidenceNote}</p>
          </div>

          {/* Negotiation context */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Negotiation Context
            </h4>
            <p className="text-sm text-gray-700">{result.negotiationContext}</p>
          </div>

          {/* Comparable sales summary */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Comparable Sales Rationale
            </h4>
            <p className="text-sm text-gray-700">{result.comparableSalesSummary}</p>
          </div>

          {/* Recommended conditions */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Recommended Conditions
            </h4>
            <ul className="space-y-1">
              {result.recommendedConditions.map((cond, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-blue-500">•</span>
                  <span className="capitalize">{cond}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal disclaimer */}
          <p className="text-xs text-gray-400 border-t border-gray-100 pt-3 mt-3">
            This is a price range suggestion based on available data — not financial advice.
            Final offer price is your decision. Consult your coordinator before submitting.
          </p>

          <button
            onClick={startJob}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Re-analyse
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-2">
          <p className="text-sm text-red-800">{error}</p>
          <button onClick={startJob} className="mt-2 text-xs text-red-600 underline">
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
