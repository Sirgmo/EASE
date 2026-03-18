'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Bed,
  Bath,
  Square,
  SlidersHorizontal,
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { MOCK_LISTINGS, NEIGHBOURHOODS, PROPERTY_TYPES, type PropertyListing } from '@/data/listings';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateClosingCosts(price: number): number {
  // Simplified closing cost estimate (LTT + legal + other)
  let ltt = 0;
  if (price > 2000000) ltt = price * 0.025 - 14475;
  else if (price > 400000) ltt = price * 0.02 - 6475;
  else if (price > 250000) ltt = price * 0.015 - 2475;
  else if (price > 55000) ltt = price * 0.01 - 725;
  else ltt = price * 0.005;

  // Toronto municipal LTT (double)
  const torontoLtt = ltt;

  // Other costs estimate
  const otherCosts = 3500; // Legal, title insurance, etc.

  return Math.round(ltt + torontoLtt + otherCosts);
}

function getRiskColor(score: number): string {
  if (score >= 80) return 'text-success-600 bg-success-100';
  if (score >= 60) return 'text-warning-600 bg-warning-100';
  return 'text-error-600 bg-error-100';
}

function getRiskLabel(score: number): string {
  if (score >= 80) return 'Low Risk';
  if (score >= 60) return 'Medium Risk';
  return 'High Risk';
}

interface PropertyCardProps {
  listing: PropertyListing;
}

function PropertyCard({ listing }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const closingCosts = calculateClosingCosts(listing.price);
  const totalCost = listing.price + closingCosts;

  return (
    <div className="group overflow-hidden rounded-2xl border border-secondary-100 bg-white shadow-sm transition-all hover:shadow-lg">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.image}
          alt={listing.address}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-secondary-900 backdrop-blur-sm">
            {listing.propertyType}
          </span>
          {listing.daysOnMarket <= 7 && (
            <span className="rounded-full bg-primary-500 px-2.5 py-1 text-xs font-semibold text-white">
              New
            </span>
          )}
        </div>

        {/* Risk Score */}
        <div className="absolute right-3 top-3">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getRiskColor(listing.riskScore)}`}>
            {listing.riskScore >= 80 ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : listing.riskScore >= 60 ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            {listing.riskScore}
          </div>
        </div>

        {/* Favorite */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute bottom-3 right-3 rounded-full bg-white/90 p-2 backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-error-500 text-error-500' : 'text-secondary-600'}`} />
        </button>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <p className="text-2xl font-bold text-white">{formatCurrency(listing.price)}</p>
          <p className="text-sm text-white/80">{listing.daysOnMarket} days on market</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-secondary-900 line-clamp-1">{listing.address}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-secondary-500">
          <MapPin className="h-4 w-4" />
          {listing.neighbourhood}, {listing.city}
        </p>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm text-secondary-600">
          <span className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {listing.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {listing.bathrooms}
          </span>
          <span className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            {listing.sqft} sqft
          </span>
        </div>

        {/* Total Cost Preview */}
        <div className="mt-4 rounded-lg bg-primary-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-600">Real Cost to Close</span>
            <span className="font-semibold text-primary-700">{formatCurrency(totalCost)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-secondary-500">
            <span>Includes ~{formatCurrency(closingCosts)} closing costs</span>
            <TrendingUp className="h-3.5 w-3.5 text-primary-500" />
          </div>
        </div>

        {/* Maintenance fee for condos */}
        {listing.maintenanceFee > 0 && (
          <p className="mt-2 text-xs text-secondary-500">
            Maintenance: {formatCurrency(listing.maintenanceFee)}/month
          </p>
        )}

        {/* CTA */}
        <Link
          href={`/property/${listing.id}`}
          className="mt-4 block w-full rounded-lg bg-primary-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [bedrooms, setBedrooms] = useState('Any');
  const [propertyType, setPropertyType] = useState('All Types');
  const [neighbourhood, setNeighbourhood] = useState('All Neighbourhoods');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const filteredListings = useMemo(() => {
    return MOCK_LISTINGS.filter((listing) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          listing.address.toLowerCase().includes(query) ||
          listing.neighbourhood.toLowerCase().includes(query) ||
          listing.city.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Price range
      if (listing.price < priceRange[0] || listing.price > priceRange[1]) return false;

      // Bedrooms
      if (bedrooms !== 'Any') {
        const minBeds = bedrooms === '4+' ? 4 : parseInt(bedrooms);
        if (bedrooms === '4+' ? listing.bedrooms < 4 : listing.bedrooms !== minBeds) return false;
      }

      // Property type
      if (propertyType !== 'All Types' && listing.propertyType !== propertyType) return false;

      // Neighbourhood
      if (neighbourhood !== 'All Neighbourhoods' && listing.neighbourhood !== neighbourhood) return false;

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'newest': return a.daysOnMarket - b.daysOnMarket;
        case 'risk': return b.riskScore - a.riskScore;
        default: return 0;
      }
    });
  }, [searchQuery, priceRange, bedrooms, propertyType, neighbourhood, sortBy]);

  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />

      {/* Search Header */}
      <div className="border-b border-secondary-200 bg-white pt-20">
        <div className="container-ease py-6">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-primary-600">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <h1 className="font-display text-2xl font-bold text-secondary-900 sm:text-3xl">
            Toronto Real Estate
          </h1>
          <p className="mt-1 text-secondary-600">
            Browse MLS listings with instant cost breakdowns and AI risk scores
          </p>

          {/* Search Bar */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by address, neighbourhood, or MLS#..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-secondary-200 bg-white py-3 pl-12 pr-4 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 rounded-xl border border-secondary-200 bg-white px-6 py-3 font-medium text-secondary-700 transition-colors hover:bg-secondary-50 sm:w-auto"
            >
              <SlidersHorizontal className="h-5 w-5" />
              Filters
              {(propertyType !== 'All Types' || neighbourhood !== 'All Neighbourhoods' || bedrooms !== 'Any') && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs text-white">
                  {[propertyType !== 'All Types', neighbourhood !== 'All Neighbourhoods', bedrooms !== 'Any'].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 rounded-xl border border-secondary-200 bg-secondary-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900">Filters</h3>
                <button
                  onClick={() => {
                    setPriceRange([0, 10000000]);
                    setBedrooms('Any');
                    setPropertyType('All Types');
                    setNeighbourhood('All Neighbourhoods');
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear all
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Price Range */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary-700">Price Range</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value={0}>No min</option>
                      <option value={500000}>$500K</option>
                      <option value={750000}>$750K</option>
                      <option value={1000000}>$1M</option>
                      <option value={1500000}>$1.5M</option>
                      <option value={2000000}>$2M</option>
                      <option value={3000000}>$3M</option>
                      <option value={5000000}>$5M</option>
                    </select>
                    <span className="text-secondary-400">-</span>
                    <select
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value={750000}>$750K</option>
                      <option value={1000000}>$1M</option>
                      <option value={1500000}>$1.5M</option>
                      <option value={2000000}>$2M</option>
                      <option value={3000000}>$3M</option>
                      <option value={5000000}>$5M</option>
                      <option value={10000000}>$10M+</option>
                    </select>
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary-700">Bedrooms</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm"
                  >
                    <option>Any</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4+</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary-700">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Neighbourhood */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary-700">Neighbourhood</label>
                  <select
                    value={neighbourhood}
                    onChange={(e) => setNeighbourhood(e.target.value)}
                    className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm"
                  >
                    {NEIGHBOURHOODS.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container-ease py-8">
        {/* Results Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-secondary-600">
            <span className="font-semibold text-secondary-900">{filteredListings.length}</span> properties found in Toronto
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="risk">Lowest Risk</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredListings.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-secondary-200 bg-white p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-secondary-300" />
            <h3 className="mt-4 font-semibold text-secondary-900">No properties found</h3>
            <p className="mt-2 text-secondary-600">Try adjusting your filters or search query</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setPriceRange([0, 10000000]);
                setBedrooms('Any');
                setPropertyType('All Types');
                setNeighbourhood('All Neighbourhoods');
              }}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white sm:p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-xl font-bold">See the Real Cost Before You Buy</h3>
              <p className="mt-2 text-primary-100">
                Every listing includes Land Transfer Tax calculations, closing costs, and AI risk assessment.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="flex-shrink-0 rounded-xl bg-white px-6 py-3 font-semibold text-primary-700 transition-colors hover:bg-primary-50"
            >
              Try the Dashboard
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
