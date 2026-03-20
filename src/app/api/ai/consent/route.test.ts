import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-1' }]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}))

vi.mock('@/db/schema/users', () => ({
  users: {},
}))

vi.mock('@/lib/env', () => ({
  env: {},
}))

import { db } from '@/db'

describe('POST /api/ai/consent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-1' }]),
        }),
      }),
    } as never)
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as never)
  })

  it('returns 200 and records consent for an authenticated user', async () => {
    const request = new Request('http://localhost/api/ai/consent', {
      method: 'POST',
      body: JSON.stringify({ consent: true }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.consented).toBe(true)
  })

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)

    const request = new Request('http://localhost/api/ai/consent', {
      method: 'POST',
      body: JSON.stringify({ consent: true }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 404 when user is not found in database', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never)

    const request = new Request('http://localhost/api/ai/consent', {
      method: 'POST',
      body: JSON.stringify({ consent: true }),
    })
    const response = await POST(request)
    expect(response.status).toBe(404)
  })
})
