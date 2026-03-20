// src/lib/ai/job-queue.ts
// Async AI job queue backed by Upstash Redis (HTTP client — serverless safe)
// Job lifecycle: pending -> running -> complete | failed
// All keys have 3600s TTL — jobs expire after 1 hour
import { redis } from '@/lib/cache'

export type JobStatus = 'pending' | 'running' | 'complete' | 'failed'
export type JobType = 'risk-score' | 'offer-strategy' | 'doc-summary'

const TTL = 3600 // 1 hour

export async function createJob(type: JobType, payload: unknown): Promise<string> {
  const jobId = crypto.randomUUID()
  await redis.set(`job:${jobId}:status`, 'pending', { ex: TTL })
  await redis.set(`job:${jobId}:payload`, JSON.stringify(payload), { ex: TTL })
  await redis.set(`job:${jobId}:type`, type, { ex: TTL })
  return jobId
}

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  return redis.get<JobStatus>(`job:${jobId}:status`)
}

export async function getJobResult(jobId: string): Promise<unknown | null> {
  const raw = await redis.get<string>(`job:${jobId}:result`)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

export async function getJobPayload(jobId: string): Promise<unknown | null> {
  const raw = await redis.get<string>(`job:${jobId}:payload`)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

export async function setJobRunning(jobId: string): Promise<void> {
  await redis.set(`job:${jobId}:status`, 'running', { ex: TTL })
}

export async function setJobResult(jobId: string, result: unknown): Promise<void> {
  await redis.set(`job:${jobId}:result`, JSON.stringify(result), { ex: TTL })
  await redis.set(`job:${jobId}:status`, 'complete', { ex: TTL })
}

export async function setJobError(jobId: string, error: string): Promise<void> {
  await redis.set(`job:${jobId}:error`, error, { ex: TTL })
  await redis.set(`job:${jobId}:status`, 'failed', { ex: TTL })
}
