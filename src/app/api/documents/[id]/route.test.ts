import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

const mockDocument = {
  id: '00000000-0000-0000-0000-000000000010',
  transactionId: '00000000-0000-0000-0000-000000000001',
  r2Key: 'transactions/tx1/docs/test.pdf',
  fileName: 'test.pdf',
  fileSizeBytes: 50000,
  contentType: 'application/pdf',
  category: 'other',
  isActive: true,
  createdAt: new Date(),
}

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockDocument]),
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
  GetObjectCommand: vi.fn().mockImplementation((args) => args),
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

    const params = Promise.resolve({ id: '00000000-0000-0000-0000-000000000010' })
    const request = new Request('http://localhost/api/documents/00000000-0000-0000-0000-000000000010')

    const response = await GET(request, { params })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('downloadUrl')
    expect(body.downloadUrl).toContain('presigned')
  })

  it('returns 403 when caller is not a party to the document transaction', async () => {
    vi.mocked(getTransactionRole).mockResolvedValue(null)

    const params = Promise.resolve({ id: '00000000-0000-0000-0000-000000000010' })
    const request = new Request('http://localhost/api/documents/00000000-0000-0000-0000-000000000010')

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

    const params = Promise.resolve({ id: '00000000-0000-0000-0000-000000000099' })
    const request = new Request('http://localhost/api/documents/00000000-0000-0000-0000-000000000099')

    const response = await GET(request, { params })
    expect(response.status).toBe(404)
  })
})
