import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { getTransactionRole } from '@/db/schema/transactionParties'
import { r2 } from '@/lib/r2'
import { env } from '@/lib/env'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  await headers()
  const { id } = await params
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const docRows = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1)

  const document = docRows[0]
  if (!document) {
    return Response.json({ error: 'Document not found' }, { status: 404 })
  }

  const role = await getTransactionRole(document.transactionId, userId)
  if (!role) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: document.r2Key,
  })

  const downloadUrl = await getSignedUrl(r2, command, { expiresIn: 300 })

  return Response.json({
    downloadUrl,
    fileName: document.fileName,
    contentType: document.contentType,
    fileSizeBytes: document.fileSizeBytes,
    category: document.category,
  })
}
