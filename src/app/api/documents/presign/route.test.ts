import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// Module-level mocks — Vitest hoists these before imports
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}))

vi.mock('@/db/schema/transactionParties', () => ({
  getTransactionRole: vi.fn(),
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
  getSignedUrl: vi.fn().mockResolvedValue('https://r2.example.com/presigned-put-url'),
}))

vi.mock('@aws-sdk/client-s3', () => ({
  // Use a class-style mock so `new PutObjectCommand(args)` works
  PutObjectCommand: vi.fn().mockImplementation(function (args: unknown) {
    return args
  }),
}))

vi.mock('@/lib/env', () => ({
  env: { R2_BUCKET_NAME: 'ease-documents' },
}))

import { getTransactionRole } from '@/db/schema/transactionParties'

// Valid v4 UUIDs (Zod v4 enforces version nibble must be 1-8)
const TX_ID = 'a0000000-0000-4000-8000-000000000001'

describe('POST /api/documents/presign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with uploadUrl and key when caller is a valid transaction party', async () => {
    vi.mocked(getTransactionRole).mockResolvedValue('buyer')

    const request = new Request('http://localhost/api/documents/presign', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: TX_ID,
        fileName: 'agreement.pdf',
        contentType: 'application/pdf',
        fileSizeBytes: 1_000_000,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('uploadUrl')
    expect(body).toHaveProperty('key')
    expect(body.uploadUrl).toContain('presigned')
  })

  it('returns 403 when caller is not a transaction party', async () => {
    vi.mocked(getTransactionRole).mockResolvedValue(null)

    const request = new Request('http://localhost/api/documents/presign', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: TX_ID,
        fileName: 'agreement.pdf',
        contentType: 'application/pdf',
        fileSizeBytes: 1_000_000,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

    const request = new Request('http://localhost/api/documents/presign', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: TX_ID,
        fileName: 'agreement.pdf',
        contentType: 'application/pdf',
        fileSizeBytes: 1_000_000,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 400 when body fails Zod validation', async () => {
    vi.mocked(getTransactionRole).mockResolvedValue('buyer')

    const request = new Request('http://localhost/api/documents/presign', {
      method: 'POST',
      body: JSON.stringify({ transactionId: 'not-a-uuid' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
