import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { documents, documentAccessRoles } from '@/db/schema/documents'
import { users } from '@/db/schema/users'
import { getTransactionRole } from '@/db/schema/transactionParties'

const saveDocumentSchema = z.object({
  transactionId: z.string().uuid(),
  r2Key: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().min(1),
  contentType: z.string().min(1),
  category: z.enum([
    'agreement_of_purchase_sale',
    'condition_waiver',
    'notice_of_fulfillment',
    'home_inspection_report',
    'title_search',
    'lawyer_letter',
    'mortgage_commitment',
    'status_certificate',
    'other',
  ]).default('other'),
  accessRoles: z.array(z.string()).min(1).default(['buyer']),
})

export async function GET(request: Request): Promise<Response> {
  await headers()
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const transactionId = searchParams.get('transactionId')
  if (!transactionId) {
    return Response.json({ error: 'transactionId query param required' }, { status: 400 })
  }

  const role = await getTransactionRole(transactionId, userId)
  if (!role) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const accessibleDocIds = await db
    .select({ documentId: documentAccessRoles.documentId })
    .from(documentAccessRoles)
    .where(eq(documentAccessRoles.role, role))

  const docIds = accessibleDocIds.map((r) => r.documentId)

  if (docIds.length === 0) {
    return Response.json({ documents: [] })
  }

  const docs = await db
    .select()
    .from(documents)
    .where(and(eq(documents.transactionId, transactionId), eq(documents.isActive, true)))
    .orderBy(desc(documents.createdAt))

  const filtered = docs.filter((d) => docIds.includes(d.id))

  return Response.json({ documents: filtered })
}

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

  const parsed = saveDocumentSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { transactionId, r2Key, fileName, fileSizeBytes, contentType, category, accessRoles } = parsed.data

  const role = await getTransactionRole(transactionId, userId)
  if (!role) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  if (userRows.length === 0) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const internalUserId = userRows[0]!.id

  const inserted = await db
    .insert(documents)
    .values({
      transactionId,
      uploaderUserId: internalUserId,
      r2Key,
      fileName,
      fileSizeBytes,
      contentType,
      category,
    })
    .returning()

  const document = inserted[0]
  if (!document) {
    return Response.json({ error: 'Insert failed' }, { status: 500 })
  }

  if (accessRoles.length > 0) {
    await db.insert(documentAccessRoles).values(
      accessRoles.map((r) => ({ documentId: document.id, role: r }))
    )
  }

  return Response.json({ document }, { status: 201 })
}
