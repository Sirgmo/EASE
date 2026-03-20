import { describe, it, expect, vi, beforeEach } from 'vitest'

// Module-level mocks — Vitest hoists these before any imports
vi.mock('@/db/schema/transactionParties', () => ({
  transactionParties: {},
  getTransactionRole: vi.fn(),
}))

vi.mock('@/db/schema/users', () => ({
  users: {},
}))

vi.mock('@/db/schema/invitations', () => ({
  transactionInvitations: {},
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

const validToken = 'aaaabbbb-cccc-dddd-eeee-ffffffffffff'

const validInvitation = {
  id: '11111111-1111-1111-1111-111111111111',
  transactionId: '22222222-2222-2222-2222-222222222222',
  invitedEmail: 'lawyer@example.com',
  role: 'lawyer',
  token: validToken,
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  usedAt: null,
  invitedByUserId: '33333333-3333-3333-3333-333333333333',
  createdAt: new Date(),
}

const existingUser = {
  id: '44444444-4444-4444-4444-444444444444',
  clerkId: 'clerk_test_user',
  email: 'lawyer@example.com',
}

let mockInvitation: typeof validInvitation | null = { ...validInvitation }
let mockUser: typeof existingUser | null = { ...existingUser }
let selectCallCount = 0

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(() => {
            selectCallCount++
            if (selectCallCount === 1) {
              return Promise.resolve(mockInvitation ? [mockInvitation] : [])
            }
            return Promise.resolve(mockUser ? [mockUser] : [])
          }),
        })),
      })),
    })),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}))

import { POST } from './route'

describe('POST /api/invitations/[token]/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvitation = { ...validInvitation }
    mockUser = { ...existingUser }
    selectCallCount = 0
  })

  it('returns 200 and inserts transaction_parties row when token is valid', async () => {
    const params = Promise.resolve({ token: validToken })
    const request = new Request(`http://localhost/api/invitations/${validToken}/accept`, {
      method: 'POST',
    })

    const response = await POST(request, { params })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.transactionId).toBe(validInvitation.transactionId)
  })

  it('returns 409 when token has already been used (single-use enforcement)', async () => {
    mockInvitation = {
      ...validInvitation,
      usedAt: new Date(Date.now() - 1000),
    }

    const params = Promise.resolve({ token: validToken })
    const request = new Request(`http://localhost/api/invitations/${validToken}/accept`, {
      method: 'POST',
    })

    const response = await POST(request, { params })
    expect(response.status).toBe(409)
  })

  it('returns 410 when token has expired', async () => {
    mockInvitation = {
      ...validInvitation,
      expiresAt: new Date(Date.now() - 1000),
    }

    const params = Promise.resolve({ token: validToken })
    const request = new Request(`http://localhost/api/invitations/${validToken}/accept`, {
      method: 'POST',
    })

    const response = await POST(request, { params })
    expect(response.status).toBe(410)
  })

  it('returns 404 when token does not exist', async () => {
    mockInvitation = null

    const params = Promise.resolve({ token: 'nonexistent-token' })
    const request = new Request(`http://localhost/api/invitations/nonexistent-token/accept`, {
      method: 'POST',
    })

    const response = await POST(request, { params })
    expect(response.status).toBe(404)
  })

  it('returns 401 when user is not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

    const params = Promise.resolve({ token: validToken })
    const request = new Request(`http://localhost/api/invitations/${validToken}/accept`, {
      method: 'POST',
    })

    const response = await POST(request, { params })
    expect(response.status).toBe(401)
  })
})
