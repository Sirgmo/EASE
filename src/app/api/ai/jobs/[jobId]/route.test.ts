import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/ai/job-queue', () => ({
  getJobStatus: vi.fn(),
  getJobResult: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
  env: {},
}))

import { getJobStatus, getJobResult } from '@/lib/ai/job-queue'

describe('GET /api/ai/jobs/[jobId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with status pending for a newly created job', async () => {
    vi.mocked(getJobStatus).mockResolvedValue('pending')
    vi.mocked(getJobResult).mockResolvedValue(null)

    const params = Promise.resolve({ jobId: 'job-uuid-1' })
    const request = new Request('http://localhost/api/ai/jobs/job-uuid-1')
    const response = await GET(request, { params })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('pending')
    expect(body.result).toBeNull()
  })

  it('returns 200 with status complete and result for a finished job', async () => {
    vi.mocked(getJobStatus).mockResolvedValue('complete')
    vi.mocked(getJobResult).mockResolvedValue({ score: 72, confidenceLow: 65, confidenceHigh: 79 })

    const params = Promise.resolve({ jobId: 'job-uuid-2' })
    const request = new Request('http://localhost/api/ai/jobs/job-uuid-2')
    const response = await GET(request, { params })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('complete')
    expect(body.result.score).toBe(72)
  })

  it('returns 404 when jobId does not exist in Redis', async () => {
    vi.mocked(getJobStatus).mockResolvedValue(null)
    vi.mocked(getJobResult).mockResolvedValue(null)

    const params = Promise.resolve({ jobId: 'nonexistent-job' })
    const request = new Request('http://localhost/api/ai/jobs/nonexistent-job')
    const response = await GET(request, { params })
    expect(response.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)

    const params = Promise.resolve({ jobId: 'job-uuid-1' })
    const request = new Request('http://localhost/api/ai/jobs/job-uuid-1')
    const response = await GET(request, { params })
    expect(response.status).toBe(401)
  })
})
