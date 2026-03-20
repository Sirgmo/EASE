// src/lib/cache.ts
// Upstash Redis cache helpers — HTTP-based, serverless-safe (no TCP connection pooling)
// Lazy singleton — Redis() is called on first use, NOT at module load time.
// This allows Next.js to complete its build-time phase without UPSTASH env vars present.
// Uses process.env directly (not env.ts) — same pattern as CRON_SECRET/STRIPE_SECRET_KEY.
import { Redis } from '@upstash/redis'

let _redis: Redis | undefined

export const redis: Redis = new Proxy({} as Redis, {
  get(_target, prop) {
    if (!_redis) {
      _redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    }
    return (_redis as unknown as Record<string | symbol, unknown>)[prop]
  },
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
