// src/components/property/ListingFacts.tsx
// Listing facts grid — displays key property details from Repliers listing data
import type { RepliersListing } from '@/types/repliers'

interface ListingFactsProps {
  listing: RepliersListing
}

export function ListingFacts({ listing }: ListingFactsProps) {
  const { details, condominium, daysOnMarket, listDate, listingBrokerage } = listing

  const facts = [
    { label: 'Property Type', value: details.propertyType },
    { label: 'Style', value: details.style },
    { label: 'Bedrooms', value: `${details.numBedrooms}${details.numBedroomsPlus ? ` + ${details.numBedroomsPlus}` : ''}` },
    { label: 'Bathrooms', value: String(details.numBathrooms) },
    { label: 'Square Footage', value: details.sqft ? `${details.sqft} sqft` : null },
    { label: 'Year Built', value: details.yearBuilt ?? null },
    { label: 'Parking', value: details.parkingSpaces ? `${details.parkingSpaces} space${details.parkingSpaces > 1 ? 's' : ''}` : null },
    { label: 'Garage', value: details.garage ?? null },
    { label: 'Den', value: details.den !== undefined ? (details.den ? 'Yes' : 'No') : null },
    { label: 'Heating', value: details.heating?.join(', ') ?? null },
    { label: 'Air Conditioning', value: details.ac ?? null },
    { label: 'Days on Market', value: `${daysOnMarket} days` },
    {
      label: 'List Date',
      value: new Date(listDate).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
    ...(condominium?.fees.maintenance
      ? [{ label: 'Maintenance Fee', value: `$${condominium.fees.maintenance.toLocaleString()}/mo` }]
      : []),
    ...(condominium?.amenities?.length
      ? [{ label: 'Amenities', value: condominium.amenities.join(', ') }]
      : []),
  ].filter((f) => f.value !== null && f.value !== undefined)

  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {facts.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-secondary-400">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-secondary-900">{String(value)}</dd>
          </div>
        ))}
      </dl>
      {/* TRREB attribution — required by VOW rules */}
      <p className="mt-6 text-xs text-secondary-400">
        Listed by {listingBrokerage}. MLS data provided via Repliers under VOW agreement.
        Data is for personal use only and may not be reproduced or redistributed.
      </p>
    </div>
  )
}
