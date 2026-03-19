// src/app/(dashboard)/property/[mlsNumber]/page.tsx
// Auth-protected property detail page — serves real Repliers data for authenticated users
// Captures immutable snapshot to properties table for Phase 3 transaction records
import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getListing, getAddressHistory } from '@/lib/repliers'
import { getCached, setCached } from '@/lib/cache'
import { db } from '@/db'
import { properties } from '@/db/schema/properties'
import { PhotoGallery } from '@/components/property/PhotoGallery'
import { PriceHistoryChart } from '@/components/property/PriceHistoryChart'
import { ListingFacts } from '@/components/property/ListingFacts'
import type { RepliersListing } from '@/types/repliers'

interface PropertyPageProps {
  params: Promise<{ mlsNumber: string }>
}

export async function generateMetadata({ params }: PropertyPageProps) {
  const { mlsNumber } = await params
  return { title: `Property ${mlsNumber} | Ease` }
}

type PriceHistoryEvent = {
  listDate?: string
  listPrice?: number
  soldPrice?: number
  event?: string
}

export default async function PropertyDetailPage({ params }: PropertyPageProps) {
  // VOW compliance: auth gate is the first operation — no data path bypasses it
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { mlsNumber } = await params

  // Try cache first (shared across users — cache key is mlsNumber only)
  const cacheKey = `listing:${mlsNumber}:history=true`
  const cached = await getCached<{ listing: RepliersListing; history: PriceHistoryEvent[] }>(cacheKey)

  let listing: RepliersListing
  let history: PriceHistoryEvent[]

  if (cached) {
    listing = cached.listing
    history = cached.history
  } else {
    try {
      const [listingResult, historyResult] = await Promise.all([
        getListing(mlsNumber),
        getAddressHistory(mlsNumber),
      ])
      listing = listingResult
      history = historyResult as PriceHistoryEvent[]
      await setCached(cacheKey, { listing, history }, 3600)
    } catch {
      notFound()
    }
  }

  // Capture immutable snapshot for Phase 3 (upsert — second view updates timestamp, not creates duplicate)
  // Fire-and-forget — do not block page render on DB write
  db.insert(properties)
    .values({ mlsNumber, snapshotData: listing! })
    .onConflictDoUpdate({
      target: properties.mlsNumber,
      set: { snapshotData: listing!, snapshotCapturedAt: new Date() },
    })
    .catch((err) => console.error('[property-snapshot] Failed to upsert:', err))

  const { address, listPrice, details } = listing!
  const addressStr = [
    address.streetNumber,
    address.streetName,
    address.streetSuffix,
    address.unitNumber ? `#${address.unitNumber}` : null,
  ]
    .filter(Boolean)
    .join(' ') + `, ${address.city}`

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Back nav */}
      <Link
        href="/search"
        className="inline-flex items-center gap-2 text-sm text-secondary-500 hover:text-secondary-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      {/* Photo gallery */}
      <PhotoGallery photos={listing!.images} address={addressStr} />

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-secondary-900">${listPrice.toLocaleString()}</p>
            <p className="mt-1 text-lg text-secondary-600">{addressStr}</p>
            <p className="text-sm text-secondary-400">
              {address.neighborhood ?? address.area}, {address.city}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/calculator"
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Calculate Total Cost
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-secondary-600">
          <span>
            {details.numBedrooms}
            {details.numBedroomsPlus ? `+${details.numBedroomsPlus}` : ''} bed
          </span>
          <span>·</span>
          <span>{details.numBathrooms} bath</span>
          {details.sqft && (
            <>
              <span>·</span>
              <span>{details.sqft} sqft</span>
            </>
          )}
          <span>·</span>
          <span>{details.propertyType}</span>
        </div>
      </div>

      {/* Listing facts */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-secondary-900">
          Property Details
        </h2>
        <ListingFacts listing={listing!} />
      </section>

      {/* Price history */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-secondary-900">
          Price History
        </h2>
        <PriceHistoryChart history={history!} currentPrice={listPrice} />
      </section>
    </div>
  )
}
