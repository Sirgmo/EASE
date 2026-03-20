// src/lib/r2.ts
// Cloudflare R2 S3-compatible client — lazy initialization prevents build-time throw.
// Uses process.env directly (not env.ts) — same pattern as CRON_SECRET/STRIPE_SECRET_KEY.
// The Proxy defers `new S3Client()` until the first property access at request time.
import { S3Client } from '@aws-sdk/client-s3'

let _r2: S3Client | undefined

export const r2: S3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    if (!_r2) {
      _r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      })
    }
    return (_r2 as unknown as Record<string | symbol, unknown>)[prop]
  },
})
