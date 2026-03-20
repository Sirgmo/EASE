'use client'

import { useEffect, useState, useCallback } from 'react'

interface KeyTerm {
  term: string
  explanation: string
  citation: string
}

interface RedFlag {
  flag: string
  explanation: string
  citation: string
}

interface DocSummaryResult {
  documentType: string
  parties: string[]
  keyTerms: KeyTerm[]
  redFlags: RedFlag[]
  citations: string[]
  lawyerFooter: string
}

type JobStatus = 'idle' | 'pending' | 'running' | 'complete' | 'failed'

interface DocSummaryPanelProps {
  documentId: string
  fileName: string
}

const POLL_INTERVAL_MS = 3000

export function DocSummaryPanel({ documentId, fileName }: DocSummaryPanelProps) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<JobStatus>('idle')
  const [result, setResult] = useState<DocSummaryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startJob = useCallback(async () => {
    setStatus('pending')
    setError(null)
    setResult(null)

    const res = await fetch('/api/ai/doc-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to start document summary')
      setStatus('failed')
      return
    }

    const { jobId: newJobId } = await res.json()
    setJobId(newJobId)
  }, [documentId])

  useEffect(() => {
    if (!jobId || status === 'complete' || status === 'failed') return

    const interval = setInterval(async () => {
      const res = await fetch(`/api/ai/jobs/${jobId}`)
      if (!res.ok) return

      const data = await res.json()
      setStatus(data.status as JobStatus)

      if (data.status === 'complete' && data.result) {
        setResult(data.result as DocSummaryResult)
        clearInterval(interval)
      } else if (data.status === 'failed') {
        setError('Document summary failed. This may happen with image-based or corrupted PDFs.')
        clearInterval(interval)
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [jobId, status])

  const isLoading = status === 'pending' || status === 'running'

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Document Summary</h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs" title={fileName}>
            {fileName}
          </p>
        </div>
        {status === 'idle' && (
          <button
            onClick={startJob}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            Summarise
          </button>
        )}
      </div>

      {status === 'idle' && (
        <p className="text-sm text-gray-500">
          Get a plain English summary of key terms, obligations, and red flags with citations from the document.
        </p>
      )}

      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm text-gray-600">
              {status === 'pending' ? 'Queuing summary...' : 'Reading and analysing document...'}
            </span>
          </div>
          <p className="text-xs text-gray-400">Typically 15–30 seconds for a standard agreement</p>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* Document type and parties */}
          <div>
            <span className="inline-block text-xs font-semibold bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 mb-2">
              {result.documentType}
            </span>
            <div className="flex flex-wrap gap-1">
              {result.parties.map((party, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                  {party}
                </span>
              ))}
            </div>
          </div>

          {/* Key terms with citation anchors */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Key Terms
            </h4>
            <ul className="space-y-3">
              {result.keyTerms.map((item, i) => (
                <li key={i} className="border-l-2 border-blue-200 pl-3">
                  <p className="text-sm font-semibold text-gray-800">{item.term}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{item.explanation}</p>
                  <p className="text-xs text-gray-400 mt-1 italic">
                    Source: {item.citation}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Red flags */}
          {result.redFlags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                Red Flags ({result.redFlags.length})
              </h4>
              <ul className="space-y-3">
                {result.redFlags.map((flag, i) => (
                  <li key={i} className="border-l-2 border-red-300 pl-3 bg-red-50 rounded-r-md py-2 pr-2">
                    <p className="text-sm font-semibold text-red-800">{flag.flag}</p>
                    <p className="text-sm text-red-700 mt-0.5">{flag.explanation}</p>
                    <p className="text-xs text-red-400 mt-1 italic">
                      Source: {flag.citation}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lawyer footer — mandatory, always rendered, non-removable */}
          <div className="border border-amber-200 bg-amber-50 rounded-md px-4 py-3 mt-4">
            <p className="text-xs text-amber-900 font-medium">
              {result.lawyerFooter}
            </p>
          </div>

          <button
            onClick={startJob}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Re-summarise
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
