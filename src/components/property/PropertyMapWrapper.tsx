// src/components/property/PropertyMapWrapper.tsx
// Server component that lazy-loads the client-only map (avoids SSR window crash)
import dynamic from 'next/dynamic'
import type { RepliersListing } from '@/types/repliers'

const PropertyMapInner = dynamic(
  () => import('./PropertyMap'),
  {
    ssr: false, // CRITICAL: Mapbox GL JS uses window — crashes on SSR without this
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-secondary-100 animate-pulse">
        <span className="text-sm text-secondary-400">Loading map...</span>
      </div>
    ),
  }
)

interface PropertyMapWrapperProps {
  listings: RepliersListing[]
  onListingSelect?: ((mlsNumber: string) => void) | undefined
}

export function PropertyMapWrapper({ listings, onListingSelect }: PropertyMapWrapperProps) {
  return <PropertyMapInner listings={listings} onListingSelect={onListingSelect} />
}
