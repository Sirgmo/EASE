import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { getTransactionRole } from '@/db/schema/transactionParties'
import { users } from '@/db/schema/users'
import { r2 } from '@/lib/r2'
import { env } from '@/lib/env'
import { createEmbeddedSigningUrl } from '@/lib/docusign'

const signSchema = z.object({
  returnUrl: z.string().url(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
): Promise<Response> {
  await headers()
  const { documentId } = await params
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

  const parsed = signSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  // Fetch document
  const docRows = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1)
  const document = docRows[0]
  if (!document) {
    return Response.json({ error: 'Document not found' }, { status: 404 })
  }

  // RBAC — caller must be party to this transaction
  const role = await getTransactionRole(document.transactionId, userId)
  if (!role) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Only PDF documents can be sent to DocuSign
  if (document.contentType !== 'application/pdf') {
    return Response.json({ error: 'Only PDF documents can be signed' }, { status: 400 })
  }

  // Fetch signer details
  const userRows = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1)
  const user = userRows[0]
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Download the PDF from R2 for DocuSign envelope
  const getCommand = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: document.r2Key,
  })

  const r2Response = await r2.send(getCommand)
  if (!r2Response.Body) {
    return Response.json({ error: 'Document file not found in storage' }, { status: 404 })
  }

  // Convert R2 stream to base64 for DocuSign envelope
  const bodyBytes = await r2Response.Body.transformToByteArray()
  const pdfBase64 = Buffer.from(bodyBytes).toString('base64')

  const signerName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

  let signingResult: { signingUrl: string; envelopeId: string }
  try {
    signingResult = await createEmbeddedSigningUrl({
      pdfBase64,
      documentName: document.fileName,
      signerEmail: user.email,
      signerName,
      returnUrl: parsed.data.returnUrl,
      clientUserId: document.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DocuSign error'
    if (message.includes('consent_required')) {
      return Response.json(
        { error: 'DocuSign admin consent required — see server logs for consent URL' },
        { status: 503 }
      )
    }
    console.error('DocuSign createEmbeddedSigningUrl error:', message)
    return Response.json({ error: 'Failed to create signing session' }, { status: 502 })
  }

  // Persist envelopeId so webhook can correlate back to this document
  await db
    .update(documents)
    .set({ docusignEnvelopeId: signingResult.envelopeId })
    .where(eq(documents.id, documentId))

  return Response.json({
    signingUrl: signingResult.signingUrl,
    envelopeId: signingResult.envelopeId,
  })
}
