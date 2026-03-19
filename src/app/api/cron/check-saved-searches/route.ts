// src/app/api/cron/check-saved-searches/route.ts
// Vercel cron endpoint — runs hourly (Pro) or daily (Hobby)
// Security: Vercel sends CRON_SECRET as Authorization: Bearer {secret}
// Idempotency: INSERT ... ON CONFLICT DO NOTHING on search_alert_log
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { savedSearches } from '@/db/schema/savedSearches'
import { searchAlertLog } from '@/db/schema/searchAlertLog'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import { searchListings } from '@/lib/repliers'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { SavedSearchAlert } from '@/emails/SavedSearchAlert'

export async function GET(request: Request) {
  // Security gate — Vercel cron sends CRON_SECRET as Authorization: Bearer {secret}
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  // Load all searches with alerts enabled
  const activeSearches = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.alertsEnabled, true))

  let alertsSent = 0
  let skipped = 0

  for (const search of activeSearches) {
    // Build Repliers search params from criteria
    const criteria = search.criteria as { city?: string; minPrice?: number; maxPrice?: number; minBedrooms?: number; propertyType?: string }
    const params = new URLSearchParams()
    if (criteria.city) params.set('city', criteria.city)
    if (criteria.minPrice) params.set('minPrice', String(criteria.minPrice))
    if (criteria.maxPrice) params.set('maxPrice', String(criteria.maxPrice))
    if (criteria.minBedrooms) params.set('minBedrooms', String(criteria.minBedrooms))
    params.set('resultsPerPage', '20')
    params.set('sortBy', 'updatedOn')

    let listings: Array<{ mlsNumber: string; listPrice: number; address: { streetNumber: string; streetName: string; streetSuffix: string; city: string }; listDate?: string }>
    try {
      const result = await searchListings(params)
      listings = result.listings ?? []
    } catch {
      console.error(`[cron] Repliers failed for search ${search.id}`)
      continue
    }

    // Filter to listings newer than lastCheckedAt (use listDate if available)
    const since = search.lastCheckedAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000)
    const newListings = listings.filter((l) => {
      if (l.listDate) return new Date(l.listDate) > since
      return true // Include listing if listDate not available
    })

    // For each new listing, check alert log for idempotency
    const unnotified: typeof newListings = []
    for (const listing of newListings) {
      try {
        // INSERT ... ON CONFLICT DO NOTHING — returns inserted row or nothing
        const [inserted] = await db
          .insert(searchAlertLog)
          .values({
            savedSearchId: search.id,
            mlsNumber: listing.mlsNumber,
          })
          .onConflictDoNothing()
          .returning()

        if (inserted) {
          unnotified.push(listing)
        } else {
          skipped++
        }
      } catch {
        skipped++
      }
    }

    if (unnotified.length === 0) continue

    // Look up user email for this search
    const [user] = await db.select().from(users).where(eq(users.id, search.userId)).limit(1)
    if (!user?.email) continue

    // Send Resend email with React Email template
    const emailHtml = await render(
      SavedSearchAlert({
        userName: user.firstName ?? 'there',
        searchName: search.name,
        newListings: unnotified.map((l) => ({
          mlsNumber: l.mlsNumber,
          address: `${l.address.streetNumber} ${l.address.streetName} ${l.address.streetSuffix}, ${l.address.city}`,
          price: l.listPrice,
        })),
        searchUrl: `${process.env.NEXT_PUBLIC_APP_URL}/search`,
      })
    )

    await resend.emails.send({
      from: 'Ease Alerts <alerts@ease.ca>',  // Must be verified domain in Resend
      to: user.email,
      subject: `${unnotified.length} new listing${unnotified.length > 1 ? 's' : ''} match your search "${search.name}"`,
      html: emailHtml,
    })

    // Update lastCheckedAt
    await db
      .update(savedSearches)
      .set({ lastCheckedAt: new Date(), updatedAt: new Date() })
      .where(eq(savedSearches.id, search.id))

    alertsSent++

    // Resend rate limit: 5 req/s — add 200ms delay between emails for v1
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return NextResponse.json({ processed: activeSearches.length, alertsSent, skipped })
}
