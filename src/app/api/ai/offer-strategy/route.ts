// src/app/api/ai/offer-strategy/route.ts
// POST: validates listing + comps, creates async job, returns jobId immediately (202)
// Background: generateObject with OfferStrategyOutputSchema, Zod-validated before storage
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic, SONNET_MODEL } from '@/lib/ai/anthropic'
import { buildOfferStrategyPrompt } from '@/lib/ai/prompts/offer-strategy'
import { OfferStrategyOutputSchema } from '@/lib/ai/schemas/offer-strategy'
import { createJob, setJobRunning, setJobResult, setJobError } from '@/lib/ai/job-queue'
import { db } from '@/db'
import { users } from '@/db/schema/users'

const comparableSaleSchema = z.object({
  address: z.string().min(1),
  salePrice: z.number().positive(),
  listPrice: z.number().positive(),
  soldDate: z.string().min(1),
  squareFootage: z.number().positive().optional(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().min(0),
  daysOnMarket: z.number().int().min(0),
})

const listingSchema = z.object({
  mlsNumber: z.string().min(1),
  address: z.string().min(1),
  listPrice: z.number().positive(),
  propertyType: z.string().min(1),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().min(0),
  squareFootage: z.number().positive().optional(),
  daysOnMarket: z.number().int().min(0),
  neighbourhood: z.string().min(1),
})

const offerStrategyRequestSchema = z.object({
  listing: listingSchema,
  // comparableSales required — empty array is allowed but prompt will note absence
  comparableSales: z.array(comparableSaleSchema),
})

export type OfferStrategyRequest = z.infer<typeof offerStrategyRequestSchema>

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

  const parsed = offerStrategyRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const jobId = await createJob('offer-strategy', parsed.data)

  runOfferStrategyJob(jobId, parsed.data).catch((err) => {
    console.error(`Offer strategy job ${jobId} failed:`, err)
  })

  return Response.json({ jobId }, { status: 202 })
}

export const maxDuration = 300

async function runOfferStrategyJob(jobId: string, payload: OfferStrategyRequest): Promise<void> {
  await setJobRunning(jobId)
  try {
    const prompt = buildOfferStrategyPrompt(payload.listing, payload.comparableSales)

    const { object } = await generateObject({
      model: anthropic(SONNET_MODEL),
      schema: OfferStrategyOutputSchema,
      prompt,
    })

    // Double-validate through Zod — the refine() guards are critical here
    // They enforce priceRangeHigh > priceRangeLow even if generateObject somehow bypasses them
    const validated = OfferStrategyOutputSchema.parse(object)
    await setJobResult(jobId, validated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await setJobError(jobId, message)
  }
}
