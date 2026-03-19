// src/app/api/listings/[mlsNumber]/route.ts
// Auth-gated proxy for property detail + address history
// VOW compliance: auth() MUST be the first check before any data access
// Cache TTL: 3600s (1 hour) — property details change less frequently than search results
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getListing, getAddressHistory } from '@/lib/repliers'
import { getCached, setCached } from '@/lib/cache'

const DETAIL_CACHE_TTL = 3600 // 1 hour — property details change less frequently than search

interface RouteParams {
  params: Promise<{ mlsNumber: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // VOW gate — must be first, before any data access
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required — MLS data requires login (VOW compliance)' },
      { status: 401 }
    )
  }

  const { mlsNumber } = await params
  const { searchParams } = new URL(request.url)
  const includeHistory = searchParams.get('history') === 'true'

  const cacheKey = `listing:${mlsNumber}:history=${includeHistory}`
  const cached = await getCached<unknown>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const [listing, history] = await Promise.all([
      getListing(mlsNumber),
      includeHistory ? getAddressHistory(mlsNumber) : Promise.resolve([]),
    ])
    const result = { listing, history }
    await setCached(cacheKey, result, DETAIL_CACHE_TTL)
    return NextResponse.json(result)
  } catch (error) {
    console.error(`[listings/${mlsNumber}] Repliers API error:`, error)
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }
}
