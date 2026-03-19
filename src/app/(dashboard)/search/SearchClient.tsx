// src/app/(dashboard)/search/SearchClient.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { PropertyMapWrapper } from '@/components/property/PropertyMapWrapper'
import { PropertyCard } from '@/components/property/PropertyCard'
import { SaveSearchButton } from '@/components/search/SaveSearchButton'
import type { RepliersListing, RepliersSearchResponse } from '@/types/repliers'

export default function SearchClient() {
  const [listings, setListings] = useState<RepliersListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [city, setCity] = useState('Toronto')
  const [view, setView] = useState<'map' | 'list'>('map')

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        city,
        resultsPerPage: '50',
        sortBy: 'updatedOn',
      })
      const res = await fetch(`/api/listings?${params.toString()}`)
      if (res.status === 401) {
        setError('Please sign in to search listings.')
        return
      }
      if (!res.ok) throw new Error(`Search failed: ${res.status}`)
      const data: RepliersSearchResponse = await res.json()
      setListings(data.listings ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [city])

  useEffect(() => {
    void fetchListings()
  }, [fetchListings])

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Filters sidebar */}
      <aside className="hidden w-64 flex-col border-r border-secondary-100 bg-white p-4 lg:flex">
        <label className="block text-sm font-medium text-secondary-700">City</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-1 rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="Toronto">Toronto</option>
          <option value="Mississauga">Mississauga</option>
          <option value="Brampton">Brampton</option>
        </select>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setView('map')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${view === 'map' ? 'bg-primary-600 text-white' : 'border border-secondary-200 text-secondary-700'}`}
          >
            Map
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${view === 'list' ? 'bg-primary-600 text-white' : 'border border-secondary-200 text-secondary-700'}`}
          >
            List
          </button>
        </div>
        {listings.length > 0 && (
          <p className="mt-4 text-xs text-secondary-400">{listings.length} active listings</p>
        )}
        <div className="mt-4">
          <SaveSearchButton criteria={{ city }} />
        </div>
      </aside>

      {/* Main content: map or list */}
      <div className="flex flex-1 overflow-hidden">
        {loading && (
          <div className="flex flex-1 items-center justify-center text-secondary-400">
            Loading listings...
          </div>
        )}
        {error && (
          <div className="flex flex-1 items-center justify-center text-red-500">{error}</div>
        )}
        {!loading && !error && view === 'map' && (
          <div className="flex-1">
            <PropertyMapWrapper listings={listings} />
          </div>
        )}
        {!loading && !error && view === 'list' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <PropertyCard key={listing.mlsNumber} listing={listing} />
              ))}
              {listings.length === 0 && (
                <p className="col-span-full text-center text-secondary-400">No listings found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
