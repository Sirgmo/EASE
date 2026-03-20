import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'
import { r2 } from '@/lib/r2'
import { env } from '@/lib/env'
import { getTransactionRole } from '@/db/schema/transactionParties'

const presignSchema = z.object({
  transactionId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  contentType: z.string().regex(
    /^(application\/pdf|image\/(jpeg|png)|application\/msword|application\/vnd\.openxmlformats-officedocument\..+)$/
  ),
  fileSizeBytes: z.number().int().min(1).max(52_428_800),
})

export async function POST(request: Request): Promise<Response> {
  await headers()
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = presignSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { transactionId, fileName, contentType } = parsed.data

  const role = await getTransactionRole(transactionId, userId)
  if (!role) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const key = `transactions/${transactionId}/docs/${crypto.randomUUID()}-${Date.now()}`

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })

  return Response.json({ uploadUrl, key, fileName })
}
