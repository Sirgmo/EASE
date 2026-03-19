// src/lib/repliers.ts
// Server-only Repliers API client — never import this in client components
// Source: docs.repliers.io — auth via REPLIERS-API-KEY header (not query param)
import { env } from '@/lib/env'
import type { RepliersListing, RepliersSearchResponse } from '@/types/repliers'

const REPLIERS_BASE = 'https://api.repliers.io'

function repliersHeaders(): HeadersInit {
  return {
    'REPLIERS-API-KEY': env.REPLIERS_API_KEY,
    'Content-Type': 'application/json',
  }
}

export async function searchListings(params: URLSearchParams): Promise<RepliersSearchResponse> {
  // Always filter to active listings only (VOW compliance — never show expired/withdrawn)
  params.set('status', 'A')
  const response = await fetch(`${REPLIERS_BASE}/listings?${params.toString()}`, {
    headers: repliersHeaders(),
    next: { revalidate: 0 }, // Never use Next.js fetch cache — Redis is the cache layer
  })
  if (!response.ok) throw new Error(`Repliers search failed: ${response.status}`)
  return response.json() as Promise<RepliersSearchResponse>
}

export async function getListing(mlsNumber: string): Promise<RepliersListing> {
  const response = await fetch(`${REPLIERS_BASE}/listings/${mlsNumber}`, {
    headers: repliersHeaders(),
    next: { revalidate: 0 },
  })
  if (!response.ok) throw new Error(`Repliers detail failed: ${response.status}`)
  return response.json() as Promise<RepliersListing>
}

export async function getAddressHistory(mlsNumber: string): Promise<unknown[]> {
  const response = await fetch(`${REPLIERS_BASE}/listings/${mlsNumber}/history`, {
    headers: repliersHeaders(),
    next: { revalidate: 0 },
  })
  if (!response.ok) throw new Error(`Repliers history failed: ${response.status}`)
  return response.json() as Promise<unknown[]>
}
