import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock cache module — redis is accessed directly, not via getCached/setCached helpers
vi.mock('@/lib/cache', () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
  },
}))

vi.mock('@/lib/env', () => ({
  env: {
    UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
  },
}))

import { createJob, getJobStatus, setJobResult, setJobError } from './job-queue'
import { redis } from '@/lib/cache'

describe('AI job queue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createJob returns a UUID string and sets status to pending in Redis', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK')
    const jobId = await createJob('risk-score', { mlsNumber: 'C12345' })
    expect(typeof jobId).toBe('string')
    // UUID v4 pattern
    expect(jobId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(redis.set).toHaveBeenCalledWith(
      `job:${jobId}:status`,
      'pending',
      { ex: 3600 }
    )
  })

  it('getJobStatus returns pending for a newly created job', async () => {
    vi.mocked(redis.get).mockResolvedValue('pending')
    const status = await getJobStatus('some-job-id')
    expect(status).toBe('pending')
    expect(redis.get).toHaveBeenCalledWith('job:some-job-id:status')
  })

  it('getJobStatus returns null for an unknown jobId', async () => {
    vi.mocked(redis.get).mockResolvedValue(null)
    const status = await getJobStatus('unknown-id')
    expect(status).toBeNull()
  })

  it('setJobResult stores result JSON and sets status to complete', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK')
    const result = { score: 72, confidenceLow: 65, confidenceHigh: 79 }
    await setJobResult('job-abc', result)
    expect(redis.set).toHaveBeenCalledWith(
      'job:job-abc:result',
      JSON.stringify(result),
      { ex: 3600 }
    )
    expect(redis.set).toHaveBeenCalledWith(
      'job:job-abc:status',
      'complete',
      { ex: 3600 }
    )
  })

  it('setJobError stores error message and sets status to failed', async () => {
    vi.mocked(redis.set).mockResolvedValue('OK')
    await setJobError('job-xyz', 'Claude API timeout')
    expect(redis.set).toHaveBeenCalledWith(
      'job:job-xyz:error',
      'Claude API timeout',
      { ex: 3600 }
    )
    expect(redis.set).toHaveBeenCalledWith(
      'job:job-xyz:status',
      'failed',
      { ex: 3600 }
    )
  })
})
