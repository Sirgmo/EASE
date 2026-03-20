import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { documents } from '@/db/schema/documents'
import { verifyDocuSignHmac } from '@/lib/docusign'
import { env } from '@/lib/env'

type DocuSignWebhookPayload = {
  event: string
  data: {
    envelopeId: string
    accountId: string
  }
}

export async function POST(request: Request): Promise<Response> {
  await headers()

  // CRITICAL: Use arrayBuffer() NOT json() — HMAC is computed over raw bytes.
  // Parsing JSON first can normalise whitespace and break the signature check.
  const rawBody = Buffer.from(await request.arrayBuffer())
  const signature = request.headers.get('x-docusign-signature-1') ?? ''

  const webhookSecret = env.DOCUSIGN_WEBHOOK_SECRET ?? ''
  if (!verifyDocuSignHmac(rawBody, signature, webhookSecret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: DocuSignWebhookPayload
  try {
    payload = JSON.parse(rawBody.toString()) as DocuSignWebhookPayload
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  if (payload.event === 'envelope-completed') {
    const { envelopeId } = payload.data

    // Find the document associated with this envelope
    const docRows = await db
      .select({ id: documents.id, transactionId: documents.transactionId })
      .from(documents)
      .where(eq(documents.docusignEnvelopeId, envelopeId))
      .limit(1)

    const document = docRows[0]

    if (document) {
      // Mark document as signed — satisfies Ontario ECA audit trail requirement
      await db
        .update(documents)
        .set({ signedAt: new Date() })
        .where(eq(documents.id, document.id))
    }
    // No error if document not found — webhook may arrive for test envelopes
  }

  return Response.json({ received: true })
}
