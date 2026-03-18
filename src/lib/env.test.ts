import { z } from 'zod'
import { describe, it, expect } from 'vitest'

// Test the env schema in isolation without importing the module
// (the module calls .parse() at import time which would throw in test env)
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  CLERK_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/dashboard'),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@host/db?sslmode=require',
  DATABASE_URL_UNPOOLED: 'postgresql://user:pass@host/db?sslmode=require',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_abc123',
  CLERK_SECRET_KEY: 'sk_test_abc123',
  CLERK_WEBHOOK_SECRET: 'whsec_abc123',
  R2_ACCOUNT_ID: 'abc123accountid',
  R2_ACCESS_KEY_ID: 'abc123accesskey',
  R2_SECRET_ACCESS_KEY: 'abc123secretkey',
  R2_BUCKET_NAME: 'ease-uploads',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
}

describe('env schema', () => {
  it('passes with all required fields present and valid', () => {
    expect(() => envSchema.parse(validEnv)).not.toThrow()
  })

  it('throws ZodError when DATABASE_URL is missing', () => {
    const { DATABASE_URL, ...rest } = validEnv
    expect(() => envSchema.parse(rest)).toThrow(z.ZodError)
  })

  it('throws ZodError when DATABASE_URL is not a valid URL', () => {
    expect(() => envSchema.parse({ ...validEnv, DATABASE_URL: 'not-a-url' })).toThrow(z.ZodError)
  })

  it('throws ZodError when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY does not start with pk_', () => {
    expect(() => envSchema.parse({ ...validEnv, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'bad_key' })).toThrow(z.ZodError)
  })

  it('throws ZodError when CLERK_SECRET_KEY does not start with sk_', () => {
    expect(() => envSchema.parse({ ...validEnv, CLERK_SECRET_KEY: 'bad_key' })).toThrow(z.ZodError)
  })
})
