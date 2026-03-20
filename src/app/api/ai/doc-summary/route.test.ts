import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// Valid v4 UUID for document ID
const DOC_ID = 'b0000000-0000-4000-8000-000000000001'
const TX_ID = 'a0000000-0000-4000-8000-000000000001'

const MOCK_DOCUMENT = {
  id: DOC_ID,
  transactionId: TX_ID,
  uploaderUserId: 'user-uuid-1',
  r2Key: 'transactions/tx-1/docs/agreement.pdf',
  fileName: 'agreement.pdf',
  fileSizeBytes: 500_000,
  contentType: 'application/pdf',
  category: 'agreement_of_purchase_sale',
  isActive: true,
  createdAt: new Date(),
}

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

// DB returns user with consent + document record (controlled per test)
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-1', aiDataConsent: true }]),
        }),
      }),
    }),
  },
}))

vi.mock('@/db/schema/users', () => ({
  users: {},
}))

vi.mock('@/db/schema/documents', () => ({
  documents: {},
}))

vi.mock('@/lib/ai/job-queue', () => ({
  createJob: vi.fn().mockResolvedValue('job-uuid-doc-1'),
  setJobRunning: vi.fn().mockResolvedValue(undefined),
  setJobResult: vi.fn().mockResolvedValue(undefined),
  setJobError: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/env', () => ({
  env: {},
}))

import { createJob } from '@/lib/ai/job-queue'
import { db } from '@/db'

describe('POST /api/ai/doc-summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createJob).mockResolvedValue('job-uuid-doc-1')

    // Default: first call returns user with consent, second call returns document
    let callCount = 0
    vi.mocked(db.select).mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            callCount++
            if (callCount === 1) {
              return Promise.resolve([{ id: 'user-uuid-1', aiDataConsent: true }])
            }
            return Promise.resolve([MOCK_DOCUMENT])
          }),
        }),
      }),
    }) as never)
  })

  it('returns 202 with jobId for a valid PDF document', async () => {
    const request = new Request('http://localhost/api/ai/doc-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: DOC_ID }),
    })
    const response = await POST(request)
    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.jobId).toBe('job-uuid-doc-1')
    expect(createJob).toHaveBeenCalledWith('doc-summary', expect.objectContaining({
      documentId: DOC_ID,
      r2Key: MOCK_DOCUMENT.r2Key,
    }))
  })

  it('returns 403 when user has not given AI data consent', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-1', aiDataConsent: false }]),
        }),
      }),
    } as never)

    const request = new Request('http://localhost/api/ai/doc-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: DOC_ID }),
    })
    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)

    const request = new Request('http://localhost/api/ai/doc-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: DOC_ID }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 400 when documentId is not a valid UUID', async () => {
    const request = new Request('http://localhost/api/ai/doc-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: 'not-a-uuid' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 404 when document does not exist in the database', async () => {
    let callCount = 0
    vi.mocked(db.select).mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            callCount++
            if (callCount === 1) {
              return Promise.resolve([{ id: 'user-uuid-1', aiDataConsent: true }])
            }
            return Promise.resolve([]) // document not found
          }),
        }),
      }),
    }) as never)

    const request = new Request('http://localhost/api/ai/doc-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: DOC_ID }),
    })
    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it('returns 400 when document is not a PDF', async () => {
    let callCount = 0
    vi.mocked(db.select).mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            callCount++
            if (callCount === 1) {
              return Promise.resolve([{ id: 'user-uuid-1', aiDataConsent: true }])
            }
            return Promise.resolve([{ ...MOCK_DOCUMENT, contentType: 'image/jpeg' }])
          }),
        }),
      }),
    }) as never)

    const request = new Request('http://localhost/api/ai/doc-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: DOC_ID }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('PDF')
  })
})

// Zod schema validation tests — pure, no mocking needed
import { DocSummaryOutputSchema } from '@/lib/ai/schemas/doc-summary'

const VALID_SUMMARY_OUTPUT = {
  documentType: 'Agreement of Purchase and Sale',
  parties: ['John Smith (Buyer)', 'Jane Doe (Seller)'],
  keyTerms: [
    {
      term: 'Completion Date',
      explanation: 'The date ownership transfers — set to June 30, 2026',
      citation: '"Completion Date: June 30, 2026" (Section 3)',
    },
  ],
  redFlags: [],
  citations: ['"Completion Date: June 30, 2026" (Section 3)'],
  lawyerFooter: 'This is a summary only. Always verify with your lawyer before signing.',
}

describe('DocSummaryOutputSchema', () => {
  it('accepts valid output with proper citations and exact lawyer footer', () => {
    const result = DocSummaryOutputSchema.safeParse(VALID_SUMMARY_OUTPUT)
    expect(result.success).toBe(true)
  })

  it('rejects output with empty citations array', () => {
    const result = DocSummaryOutputSchema.safeParse({
      ...VALID_SUMMARY_OUTPUT,
      citations: [], // must have at least one citation
    })
    expect(result.success).toBe(false)
  })

  it('rejects output with paraphrased lawyer footer', () => {
    const result = DocSummaryOutputSchema.safeParse({
      ...VALID_SUMMARY_OUTPUT,
      lawyerFooter: 'Please consult your lawyer before signing this document.',
    })
    expect(result.success).toBe(false)
  })

  it('rejects output with missing lawyer footer entirely', () => {
    const { lawyerFooter: _lf, ...withoutFooter } = VALID_SUMMARY_OUTPUT
    const result = DocSummaryOutputSchema.safeParse(withoutFooter)
    expect(result.success).toBe(false)
  })

  it('rejects output with empty keyTerms array', () => {
    const result = DocSummaryOutputSchema.safeParse({
      ...VALID_SUMMARY_OUTPUT,
      keyTerms: [], // must have at least one key term
    })
    expect(result.success).toBe(false)
  })

  it('accepts output with the exact lawyerFooter literal (no extra whitespace or chars)', () => {
    // The literal must match exactly — even trailing period matters
    const result = DocSummaryOutputSchema.safeParse({
      ...VALID_SUMMARY_OUTPUT,
      lawyerFooter: 'This is a summary only. Always verify with your lawyer before signing.',
    })
    expect(result.success).toBe(true)
  })
})
