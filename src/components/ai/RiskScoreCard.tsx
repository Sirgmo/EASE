'use client'

import { useEffect, useState, useCallback } from 'react'

interface RiskFactor {
  name: string
  impact: 'positive' | 'negative' | 'neutral'
  explanation: string
}

interface RiskScoreResult {
  score: number
  confidenceLow: number
  confidenceHigh: number
  factors: RiskFactor[]
  summary: string
}

type JobStatus = 'idle' | 'pending' | 'running' | 'complete' | 'failed'

interface RiskScoreCardProps {
  mlsNumber: string
  address: string
  listPrice: number
  assessedValue?: number
  yearBuilt?: number
  propertyType: string
  neighbourhood: string
  daysOnMarket?: number
}

const POLL_INTERVAL_MS = 3000

export function RiskScoreCard(props: RiskScoreCardProps) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<JobStatus>('idle')
  const [result, setResult] = useState<RiskScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startJob = useCallback(async () => {
    setStatus('pending')
    setError(null)
    setResult(null)

    const res = await fetch('/api/ai/risk-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(props),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to start risk score analysis')
      setStatus('failed')
      return
    }

    const { jobId: newJobId } = await res.json()
    setJobId(newJobId)
  }, [props])

  // Poll for job completion
  useEffect(() => {
    if (!jobId || status === 'complete' || status === 'failed') return

    const interval = setInterval(async () => {
      const res = await fetch(`/api/ai/jobs/${jobId}`)
      if (!res.ok) return

      const data = await res.json()
      setStatus(data.status as JobStatus)

      if (data.status === 'complete' && data.result) {
        setResult(data.result as RiskScoreResult)
        clearInterval(interval)
      } else if (data.status === 'failed') {
        setError('Risk score analysis failed. Please try again.')
        clearInterval(interval)
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [jobId, status])

  const isLoading = status === 'pending' || status === 'running'
  const intervalWidth = result ? result.confidenceHigh - result.confidenceLow : 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Property Risk Score</h3>
        {status === 'idle' && (
          <button
            onClick={startJob}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Analyse Risk
          </button>
        )}
      </div>

      {status === 'idle' && (
        <p className="text-sm text-gray-500">
          Get an AI-generated risk assessment with factor explanations before making your offer.
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm text-gray-600">
              {status === 'pending' ? 'Queuing analysis...' : 'Analysing property risk factors...'}
            </span>
          </div>
          <p className="text-xs text-gray-400">This typically takes 10–20 seconds</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Score with confidence interval — never shown without the interval */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm text-gray-600">Risk Score</span>
              <span className="text-sm font-medium text-gray-700">
                {result.confidenceLow}–{result.confidenceHigh}{' '}
                <span className="text-xs text-gray-400">(confidence range)</span>
              </span>
            </div>
            {/* Confidence interval bar */}
            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
              {/* Full bar background */}
              <div className="absolute inset-0 bg-gray-100 rounded-full" />
              {/* Confidence interval highlight */}
              <div
                className="absolute top-0 bottom-0 bg-blue-200 rounded-full"
                style={{
                  left: `${result.confidenceLow}%`,
                  width: `${intervalWidth}%`,
                }}
              />
              {/* Score point marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-blue-600 rounded-full"
                style={{ left: `${result.score}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>Higher Risk (0)</span>
              <span>Lower Risk (100)</span>
            </div>
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-700">{result.summary}</p>

          {/* Risk factors */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Risk Factors
            </h4>
            <ul className="space-y-2">
              {result.factors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 text-sm ${
                      factor.impact === 'positive'
                        ? 'text-green-600'
                        : factor.impact === 'negative'
                        ? 'text-red-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '−' : '·'}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-gray-800">{factor.name}: </span>
                    <span className="text-sm text-gray-600">{factor.explanation}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

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
          <button
            onClick={startJob}
            className="mt-2 text-xs text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
