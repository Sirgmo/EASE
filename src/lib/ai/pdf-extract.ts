// src/lib/ai/pdf-extract.ts
// Extracts plain text from a PDF stored in Cloudflare R2
// pdf-parse is a CJS module. Its @types/pdf-parse declaration doesn't declare a default export
// in the ESM types resolution path. Using ts-expect-error suppresses this while keeping the
// runtime import working. Vitest mocks pdf-parse as { default: fn } which the ESM import resolves.
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { r2 } from '@/lib/r2'
import { env } from '@/lib/env'

export async function extractPdfTextFromR2(r2Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: r2Key,
  })
  const response = await r2.send(command)
  if (!response.Body) {
    throw new Error('Document not found in R2')
  }
  const bytes = await response.Body.transformToByteArray()
  const buffer = Buffer.from(bytes)

  // Lazy require prevents Turbopack from statically tracing pdf-parse (CJS/AMD module).
  // Top-level static imports of pdf-parse cause AMD define() errors in Turbopack builds.
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const pdfParseModule = require('pdf-parse') as any
  const pdfParse = pdfParseModule.default ?? pdfParseModule

  const data = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buffer)
  return data.text
}
