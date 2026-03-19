import { z } from 'zod'

const envSchema = z.object({
  // Database — Neon provides two URLs
  // DATABASE_URL: pooled connection (PgBouncer) — for runtime Drizzle queries
  // DATABASE_URL_UNPOOLED: direct connection — for drizzle-kit migrations only
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url(),
  // Clerk authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  CLERK_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  // Clerk redirect configuration
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/dashboard'),
  // Cloudflare R2 file storage
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url(),
  // Repliers MLS API (server-side only — never expose to browser)
  REPLIERS_API_KEY: z.string().min(1),
  // Mapbox (public — used in browser for map tiles)
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
  // Upstash Redis (serverless cache for Repliers API responses)
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
