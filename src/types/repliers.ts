// src/types/repliers.ts
// Source: Repliers API docs — MEDIUM confidence, validate field names against sandbox

export interface RepliersListing {
  mlsNumber: string
  status: 'A' | 'U' | 'D' // Active, Unavailable, Deleted
  listPrice: number
  address: {
    streetNumber: string
    streetName: string
    streetSuffix: string
    unitNumber?: string
    city: string
    state: string
    zip: string
    area: string
    district?: string
    neighborhood?: string
  }
  map: {
    latitude: number
    longitude: number
  }
  details: {
    propertyType: string   // 'Detached', 'Condo Apt', 'Semi-Detached', etc.
    style: string
    numBedrooms: number
    numBedroomsPlus?: number
    numBathrooms: number
    sqft?: string          // Range string e.g. "1200-1399"
    yearBuilt?: string
    garage?: string
    parkingSpaces?: number
    den?: boolean
    basement?: string[]
    heating?: string[]
    ac?: string
  }
  condominium?: {
    fees: { maintenance?: number }
    amenities?: string[]
    locker?: string
  }
  images: Array<{
    smallUrl: string
    mediumUrl: string
    largeUrl: string
  }>
  daysOnMarket: number
  listDate: string
  lastStatus?: string
  soldPrice?: number       // VOW data — only show to authenticated users
  originalPrice?: number
  listingBrokerage: string
  office: { brokerageName: string }
  timestamps: {
    createdAt: string
    updatedAt: string
    expiryDate: string
  }
}

export interface RepliersSearchResponse {
  count: number
  numFound: number
  page: number
  listings: RepliersListing[]
  statistics?: Record<string, unknown>
}
