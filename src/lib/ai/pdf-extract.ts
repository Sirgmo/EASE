// src/lib/ai/pdf-extract.ts
// Extracts plain text from a PDF stored in Cloudflare R2
// pdf-parse is a CJS module. Its @types/pdf-parse declaration doesn't declare a default export
// in the ESM types resolution path. Using ts-expect-error suppresses this while keeping the
// runtime import working. Vitest mocks pdf-parse as { default: fn } which the ESM import resolves.
import { GetObjectCommand } from '@aws-sdk/client-s3'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — pdf-parse CJS types don't export a default in ESM resolution
import pdfParse from 'pdf-parse'
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
  const data = await pdfParse(buffer)
  return data.text
}
