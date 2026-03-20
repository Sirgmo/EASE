import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: '00000000-0000-0000-0000-000000000010',
          transactionId: '00000000-0000-0000-0000-000000000001',
          category: 'other',
          fileName: 'test.pdf',
          r2Key: 'transactions/tx1/docs/uuid-123',
          fileSizeBytes: 50000,
          contentType: 'application/pdf',
          isActive: true,
          createdAt: new Date(),
        }]),
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
  documentCategoryEnum: {},
}))

vi.mock('@/db/schema/users', () => ({
  users: {},
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

import { getTransactionRole } from '@/db/schema/transactionParties'

describe('POST /api/documents (save metadata)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves document metadata with correct transactionId and category', async () => {
    vi.mocked(getTransactionRole).mockResolvedValue('buyer')
    // Mock user lookup
    const { db } = await import('@/db')
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-123' }]),
        }),
      }),
    } as any)

    const request = new Request('http://localhost/api/documents', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: '00000000-0000-0000-0000-000000000001',
        r2Key: 'transactions/tx1/docs/uuid-123',
        fileName: 'agreement.pdf',
        fileSizeBytes: 50000,
        contentType: 'application/pdf',
        category: 'agreement_of_purchase_sale',
        accessRoles: ['buyer', 'lawyer'],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.document.transactionId).toBe('00000000-0000-0000-0000-000000000001')
  })

  it('returns 403 when caller is not a transaction party', async () => {
    vi.mocked(getTransactionRole).mockResolvedValue(null)

    const request = new Request('http://localhost/api/documents', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: '00000000-0000-0000-0000-000000000001',
        r2Key: 'transactions/tx1/docs/uuid-123',
        fileName: 'test.pdf',
        fileSizeBytes: 50000,
        contentType: 'application/pdf',
        category: 'other',
        accessRoles: ['buyer'],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })
})
