// src/app/api/ai/doc-summary/route.ts
// POST: validates documentId, checks PDF contentType, creates async job, returns jobId (202)
// Background: extracts PDF text from R2, calls generateObject, validates via Zod, stores result
// Critical: lawyerFooter is enforced as an exact literal by the Zod schema
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic, SONNET_MODEL } from '@/lib/ai/anthropic'
import { buildDocSummaryPrompt } from '@/lib/ai/prompts/doc-summary'
import { DocSummaryOutputSchema } from '@/lib/ai/schemas/doc-summary'
import { extractPdfTextFromR2 } from '@/lib/ai/pdf-extract'
import { createJob, setJobRunning, setJobResult, setJobError } from '@/lib/ai/job-queue'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { documents } from '@/db/schema/documents'

const docSummaryRequestSchema = z.object({
  documentId: z.string().uuid('documentId must be a valid UUID'),
})

interface DocSummaryJobPayload {
  documentId: string
  r2Key: string
  fileName: string
}

export async function POST(request: Request): Promise<Response> {
  await headers()
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  // PIPEDA consent gate
  const userRows = await db
    .select({ id: users.id, aiDataConsent: users.aiDataConsent })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  const user = userRows[0]
  if (!user || !user.aiDataConsent) {
    return Response.json(
      { error: 'AI data processing consent required.' },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = docSummaryRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { documentId } = parsed.data

  // Fetch document metadata — need r2Key and contentType
  const docRows = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1)

  const document = docRows[0]
  if (!document) {
    return Response.json({ error: 'Document not found' }, { status: 404 })
  }

  // Only PDF documents can be summarised — pdf-parse handles PDFs only
  if (document.contentType !== 'application/pdf') {
    return Response.json(
      { error: 'Only PDF documents can be summarised. Non-PDF files are not supported.' },
      { status: 400 }
    )
  }

  const jobPayload: DocSummaryJobPayload = {
    documentId,
    r2Key: document.r2Key,
    fileName: document.fileName,
  }

  const jobId = await createJob('doc-summary', jobPayload)

  runDocSummaryJob(jobId, jobPayload).catch((err) => {
    console.error(`Doc summary job ${jobId} failed:`, err)
  })

  return Response.json({ jobId, fileName: document.fileName }, { status: 202 })
}

export const maxDuration = 300

async function runDocSummaryJob(jobId: string, payload: DocSummaryJobPayload): Promise<void> {
  await setJobRunning(jobId)
  try {
    // Extract PDF text from R2 before calling Claude
    const pdfText = await extractPdfTextFromR2(payload.r2Key)

    if (!pdfText || pdfText.trim().length < 50) {
      throw new Error('PDF text extraction returned insufficient content — document may be image-based or corrupted')
    }

    const systemPrompt = buildDocSummaryPrompt()

    // generateObject enforces DocSummaryOutputSchema — lawyerFooter literal is enforced by Zod
    // Claude must output the exact footer string or the schema parse will fail
    const { object } = await generateObject({
      model: anthropic(SONNET_MODEL),
      schema: DocSummaryOutputSchema,
      system: systemPrompt,
      prompt: `Summarise the following document:\n\n${pdfText.slice(0, 80_000)}`, // 80k char limit
    })

    // Double-validate — lawyerFooter literal enforcement is the critical guard here
    const validated = DocSummaryOutputSchema.parse(object)
    await setJobResult(jobId, validated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await setJobError(jobId, message)
  }
}
