// src/app/api/offers/route.ts
// POST handler for creating / saving offers (OREA Form 100 field capture)
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { offers, offerReviews } from '@/db/schema/offers'
import { validateOfferFields } from '@/lib/transactions/offers-validation'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  // Auth gate — must be first, before any data access
  await headers()
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate offer fields via Zod schema
  const validation = validateOfferFields(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 422 }
    )
  }

  const offerData = validation.data

  // Look up internal user.id from users where clerkId = userId
  const [user] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1)
  if (!user) {
    return NextResponse.json(
      { error: 'User not found — ensure webhook sync has run' },
      { status: 404 }
    )
  }

  // Determine if this is a submit action (moves to partner review queue)
  const isSubmit = typeof body === 'object' && body !== null && 'submit' in body && (body as { submit: unknown }).submit === true

  // Build the offer insert payload
  const newOffer = {
    transactionId: offerData.transactionId,
    purchasePrice: offerData.purchasePrice,
    deposit: offerData.deposit ?? null,
    irrevocabilityDeadline: offerData.irrevocabilityDeadline
      ? new Date(offerData.irrevocabilityDeadline)
      : null,
    completionDate: offerData.completionDate
      ? new Date(offerData.completionDate)
      : null,
    financingConditionDays: offerData.financingConditionDays ?? null,
    inspectionConditionDays: offerData.inspectionConditionDays ?? null,
    chattelsIncluded: offerData.chattelsIncluded ?? null,
    fixturesExcluded: offerData.fixturesExcluded ?? null,
    rentalItems: offerData.rentalItems ?? null,
    status: isSubmit ? ('under_partner_review' as const) : ('draft' as const),
    submittedAt: isSubmit ? new Date() : null,
    createdBy: user.id,
  }

  const [offer] = await db.insert(offers).values(newOffer).returning()

  // If submitting, create a partner review queue entry
  if (isSubmit && offer) {
    await db.insert(offerReviews).values({
      offerId: offer.id,
      status: 'pending',
    })
  }

  return NextResponse.json({ offer }, { status: 201 })
}
