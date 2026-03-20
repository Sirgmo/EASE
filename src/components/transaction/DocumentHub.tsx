'use client'

import { useState, useEffect, useRef } from 'react'

interface DocumentRecord {
  id: string
  fileName: string
  category: string
  fileSizeBytes: number
  contentType: string
  createdAt: string | Date
  signedAt?: string | Date | null
}

interface DocumentHubProps {
  transactionId: string
  userRole: string
}

const CATEGORY_LABELS: Record<string, string> = {
  agreement_of_purchase_sale: 'Agreement',
  condition_waiver: 'Condition Waiver',
  notice_of_fulfillment: 'Notice of Fulfillment',
  home_inspection_report: 'Inspection Report',
  title_search: 'Title Search',
  lawyer_letter: 'Lawyer Letter',
  mortgage_commitment: 'Mortgage Commitment',
  status_certificate: 'Status Certificate',
  other: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  agreement_of_purchase_sale: 'bg-blue-100 text-blue-800',
  condition_waiver: 'bg-amber-100 text-amber-800',
  notice_of_fulfillment: 'bg-green-100 text-green-800',
  home_inspection_report: 'bg-purple-100 text-purple-800',
  title_search: 'bg-indigo-100 text-indigo-800',
  lawyer_letter: 'bg-gray-100 text-gray-800',
  mortgage_commitment: 'bg-cyan-100 text-cyan-800',
  status_certificate: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-600',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'agreement_of_purchase_sale', label: 'Agreement' },
  { value: 'condition_waiver', label: 'Conditions' },
  { value: 'home_inspection_report', label: 'Inspection' },
  { value: 'title_search', label: 'Title' },
  { value: 'mortgage_commitment', label: 'Mortgage' },
  { value: 'other', label: 'Other' },
]

export function DocumentHub({ transactionId, userRole }: DocumentHubProps) {
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch(`/api/documents?transactionId=${transactionId}`)
        if (res.ok) {
          const data = await res.json() as { documents: DocumentRecord[] }
          setDocs(data.documents)
        }
      } finally {
        setIsLoading(false)
      }
    }
    void fetchDocs()
  }, [transactionId])

  async function handleUpload(file: File) {
    setIsUploading(true)
    setUploadError(null)
    try {
      // Step 1: Get presigned URL (RBAC-gated)
      const presignRes = await fetch('/api/documents/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          fileName: file.name,
          contentType: file.type,
          fileSizeBytes: file.size,
        }),
      })
      if (!presignRes.ok) {
        const err = await presignRes.json() as { error: string }
        throw new Error(err.error ?? 'Failed to get upload URL')
      }
      const { uploadUrl, key } = await presignRes.json() as { uploadUrl: string; key: string }

      // Step 2: Upload directly to R2 (bypasses Next.js — avoids 4.5MB Vercel limit)
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) throw new Error('Upload to storage failed')

      // Step 3: Save metadata to Postgres
      const metaRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          r2Key: key,
          fileName: file.name,
          fileSizeBytes: file.size,
          contentType: file.type,
          category: 'other',
          accessRoles: [userRole, 'licensed_partner'],
        }),
      })
      if (!metaRes.ok) throw new Error('Failed to save document metadata')

      const newDoc = await metaRes.json() as { document: DocumentRecord }
      setDocs((prev) => [newDoc.document, ...prev])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDownload(docId: string, _fileName: string) {
    try {
      const res = await fetch(`/api/documents/${docId}`)
      if (!res.ok) return
      const { downloadUrl } = await res.json() as { downloadUrl: string }
      window.open(downloadUrl, '_blank')
    } catch {
      // ignore — network error
    }
  }

  const filteredDocs = selectedCategory === 'all'
    ? docs
    : docs.filter((d) => d.category === selectedCategory)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleUpload(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSelectedCategory(f.value)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Document list */}
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading documents...</p>
      ) : filteredDocs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          {docs.length === 0
            ? 'No documents yet. Upload the first one.'
            : 'No documents match the selected filter.'}
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded cursor-pointer"
              onClick={() => void handleDownload(doc.id, doc.fileName)}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatFileSize(doc.fileSizeBytes)} · {formatDate(doc.createdAt)}
                    {doc.signedAt && (
                      <span className="ml-2 text-green-600">Signed</span>
                    )}
                  </p>
                </div>
              </div>
              <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[doc.category] ?? 'bg-gray-100 text-gray-600'}`}>
                {CATEGORY_LABELS[doc.category] ?? doc.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DocumentHub
