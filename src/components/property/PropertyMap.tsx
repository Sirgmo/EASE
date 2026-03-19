// src/components/property/PropertyMap.tsx
// 'use client' required — Mapbox GL JS accesses window at import time (SSR-incompatible)
'use client'
// Source: react-map-gl v8 docs — import from 'react-map-gl/mapbox' for Mapbox GL v3
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useState } from 'react'
import type { RepliersListing } from '@/types/repliers'

interface PropertyMapProps {
  listings: RepliersListing[]
  onListingSelect?: ((mlsNumber: string) => void) | undefined
}

export default function PropertyMap({ listings, onListingSelect }: PropertyMapProps) {
  const [selectedListing, setSelectedListing] = useState<RepliersListing | null>(null)

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''}
      initialViewState={{ longitude: -79.3832, latitude: 43.6532, zoom: 11 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {listings.map((listing) => (
        <Marker
          key={listing.mlsNumber}
          longitude={listing.map.longitude}
          latitude={listing.map.latitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setSelectedListing(listing)
            onListingSelect?.(listing.mlsNumber)
          }}
        >
          <div className="cursor-pointer rounded-full bg-primary-600 px-2 py-1 text-xs font-semibold text-white shadow-md hover:bg-primary-700">
            ${Math.round(listing.listPrice / 1000)}k
          </div>
        </Marker>
      ))}

      {selectedListing && (
        <Popup
          longitude={selectedListing.map.longitude}
          latitude={selectedListing.map.latitude}
          anchor="top"
          onClose={() => setSelectedListing(null)}
          closeOnClick={false}
        >
          <div className="p-2 text-sm">
            <p className="font-semibold">${selectedListing.listPrice.toLocaleString()}</p>
            <p className="text-secondary-600">
              {selectedListing.address.streetNumber} {selectedListing.address.streetName}
            </p>
            <p className="text-xs text-secondary-400">{selectedListing.listingBrokerage}</p>
          </div>
        </Popup>
      )}
    </Map>
  )
}
