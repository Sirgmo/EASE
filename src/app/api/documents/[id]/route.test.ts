import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

// Valid v4 UUIDs (Zod v4 enforces version nibble must be 1-8)
const DOC_ID = 'b0000000-0000-4000-8000-000000000010'

// Cannot reference module-level variables in vi.mock factory (hoisting issue).
// Use inline object instead.
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 'b0000000-0000-4000-8000-000000000010',
            transactionId: 'a0000000-0000-4000-8000-000000000001',
            r2Key: 'transactions/tx1/docs/test.pdf',
            fileName: 'test.pdf',
            fileSizeBytes: 50000,
            contentType: 'application/pdf',
            category: 'other',
            isActive: true,
            createdAt: new Date(),
          }]),
        }),
      }),
    }),
  },
}))

vi.mock('@/db/schema/transactionParties', () => ({
  getTransactionRole: vi.fn(),
}))

vi.mock('@/db/schema/documents', () => ({
  documents: {},
  documentAccessRoles: {},
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/r2', () => ({
  r2: {},
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://r2.example.com/presigned-get-url?expires=300'),
}))

vi.mock('@aws-sdk/client-s3', () => ({
  // Use a class-style mock so `new GetObjectCommand(args)` works
  GetObjectCommand: vi.fn().mockImplementation(function (args: unknown) {
    return args
  }),
}))

vi.mock('@/lib/env', () => ({
  env: { R2_BUCKET_NAME: 'ease-documents' },
}))

import { getTransactionRole } from '@/db/schema/transactionParties'

describe('GET /api/documents/[id] (download URL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with presigned download URL when caller is a valid party', async () => {
    vi.mocked(getTransactionRole).mockResolvedValue('buyer')

    const params = Promise.resolve({ id: DOC_ID })
    const request = new Request(`http://localhost/api/documents/${DOC_ID}`)

    const response = await GET(request, { params })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('downloadUrl')
    expect(body.downloadUrl).toContain('presigned')
  })

  it('returns 403 when caller is not a party to the document transaction', async () => {
    vi.mocked(getTransactionRole).mockResolvedValue(null)

    const params = Promise.resolve({ id: DOC_ID })
    const request = new Request(`http://localhost/api/documents/${DOC_ID}`)

    const response = await GET(request, { params })
    expect(response.status).toBe(403)
  })

  it('returns 404 when document does not exist', async () => {
    const { db } = await import('@/db')
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any)

    vi.mocked(getTransactionRole).mockResolvedValue('buyer')

    const missingId = 'c0000000-0000-4000-8000-000000000099'
    const params = Promise.resolve({ id: missingId })
    const request = new Request(`http://localhost/api/documents/${missingId}`)

    const response = await GET(request, { params })
    expect(response.status).toBe(404)
  })
})
