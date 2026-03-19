// src/components/property/PropertyCard.tsx
import Link from 'next/link'
import { Bed, Bath, Square } from 'lucide-react'
import type { RepliersListing } from '@/types/repliers'

interface PropertyCardProps {
  listing: RepliersListing
}

export function PropertyCard({ listing }: PropertyCardProps) {
  const { address, details, listPrice, mlsNumber, listingBrokerage, images, daysOnMarket } = listing
  const addressStr = `${address.streetNumber} ${address.streetName} ${address.streetSuffix}${address.unitNumber ? ` #${address.unitNumber}` : ''}`

  return (
    <Link href={`/property/${mlsNumber}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-secondary-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* Photo */}
        <div className="relative aspect-[4/3] bg-secondary-100">
          {images[0] ? (
            <img
              src={images[0].mediumUrl}
              alt={addressStr}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-secondary-300">No photo</div>
          )}
          <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {daysOnMarket}d on market
          </div>
        </div>

        {/* Details */}
        <div className="p-4">
          <p className="text-xl font-bold text-secondary-900">${listPrice.toLocaleString()}</p>
          <p className="mt-1 text-sm text-secondary-600 truncate">{addressStr}</p>
          <p className="text-xs text-secondary-400">{address.city}, {address.state}</p>

          <div className="mt-3 flex items-center gap-4 text-sm text-secondary-600">
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {details.numBedrooms}{details.numBedroomsPlus ? `+${details.numBedroomsPlus}` : ''} bed
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {details.numBathrooms} bath
            </span>
            {details.sqft && (
              <span className="flex items-center gap-1">
                <Square className="h-4 w-4" />
                {details.sqft} sqft
              </span>
            )}
          </div>

          {/* TRREB attribution — required by VOW rules */}
          <p className="mt-2 text-xs text-secondary-400 truncate">Listed by {listingBrokerage}</p>
        </div>
      </div>
    </Link>
  )
}
