// src/lib/cache.ts
// Upstash Redis cache helpers — HTTP-based, serverless-safe (no TCP connection pooling)
// Source: @upstash/redis docs (redis.upstash.com)
import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

export async function getCached<T>(key: string): Promise<T | null> {
  return redis.get<T>(key)
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds })
}

export async function deleteCached(key: string): Promise<void> {
  await redis.del(key)
}
