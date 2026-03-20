// src/app/api/ai/risk-score/route.ts
// POST: validates input, creates async job, returns jobId immediately (202)
// Background: separate function runs Claude generateObject, validates via Zod, stores result
// Client polls GET /api/ai/jobs/[jobId] for status + result
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic, SONNET_MODEL } from '@/lib/ai/anthropic'
import { buildRiskScorePrompt } from '@/lib/ai/prompts/risk-score'
import { RiskScoreOutputSchema } from '@/lib/ai/schemas/risk-score'
import { createJob, setJobRunning, setJobResult, setJobError } from '@/lib/ai/job-queue'
import { db } from '@/db'
import { users } from '@/db/schema/users'

const riskScoreRequestSchema = z.object({
  mlsNumber: z.string().min(1),
  address: z.string().min(1),
  listPrice: z.number().positive(),
  assessedValue: z.number().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(2030).optional(),
  propertyType: z.string().min(1),
  neighbourhood: z.string().min(1),
  daysOnMarket: z.number().int().min(0).optional(),
})

export type RiskScoreRequest = z.infer<typeof riskScoreRequestSchema>

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

  const parsed = riskScoreRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  // Create async job — returns immediately with jobId
  const jobId = await createJob('risk-score', parsed.data)

  // Kick off background processing without awaiting
  runRiskScoreJob(jobId, parsed.data).catch((err) => {
    console.error(`Risk score job ${jobId} failed:`, err)
  })

  return Response.json({ jobId }, { status: 202 })
}

// Vercel background functions: keep alive for up to maxDuration seconds
export const maxDuration = 300

async function runRiskScoreJob(jobId: string, propertyData: RiskScoreRequest): Promise<void> {
  await setJobRunning(jobId)
  try {
    const prompt = buildRiskScorePrompt(propertyData)

    // generateObject enforces Zod schema — Claude must output structured JSON
    const { object } = await generateObject({
      model: anthropic(SONNET_MODEL), // Sonnet for complex analysis
      schema: RiskScoreOutputSchema,
      prompt,
    })

    // Double-validate through Zod before storing — never store raw LLM output
    const validated = RiskScoreOutputSchema.parse(object)
    await setJobResult(jobId, validated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await setJobError(jobId, message)
  }
}
