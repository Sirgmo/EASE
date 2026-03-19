// src/app/api/listings/route.ts
// VOW compliance: ALL MLS data requires authentication — auth() MUST be first check
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { searchListings } from '@/lib/repliers'
import { getCached, setCached } from '@/lib/cache'

// TTL: 15 minutes — TRREB requires rapid sync; 900s is safe for VOW compliance
const CACHE_TTL_SECONDS = 900

export async function GET(request: NextRequest) {
  // VOW gate — must be first, before any data access
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required — MLS data requires login (VOW compliance)' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  // Create cache key from all query params (exclude user-specific params for shared cache)
  const cacheKey = `listings:${searchParams.toString()}`

  // Cache-aside: check Redis first
  const cached = await getCached<unknown>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const data = await searchListings(searchParams)
    await setCached(cacheKey, data, CACHE_TTL_SECONDS)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[listings] Repliers API error:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 502 })
  }
}
