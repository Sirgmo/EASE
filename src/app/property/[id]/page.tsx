import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Bath,
  Bed,
  Calendar,
  Car,
  ChevronRight,
  Heart,
  MapPin,
  Maximize,
  Share2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { TotalCostBreakdown } from '@/components/property';

// Mock property data - will be replaced with database queries
const MOCK_PROPERTIES: Record<
  string,
  {
    id: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    yearBuilt: number;
    parkingSpaces: number;
    propertyType: 'house' | 'condo';
    description: string;
    features: string[];
    images: string[];
    aiRiskScore: number;
    aiEstimatedValue: number;
    daysOnMarket: number;
  }
> = {
  '1': {
    id: '1',
    address: '123 Queen Street West',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5H 2M9',
    price: 899000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1850,
    yearBuilt: 2018,
    parkingSpaces: 1,
    propertyType: 'condo',
    description:
      'Stunning 3-bedroom condo in the heart of downtown Toronto. This modern unit features floor-to-ceiling windows, premium finishes, and breathtaking city views. Walking distance to transit, restaurants, and entertainment.',
    features: [
      'Floor-to-ceiling windows',
      'Open concept layout',
      'Stainless steel appliances',
      'In-suite laundry',
      'Building gym & pool',
      '24/7 Concierge',
    ],
    images: ['/placeholder-property-1.jpg'],
    aiRiskScore: 0.15,
    aiEstimatedValue: 915000,
    daysOnMarket: 12,
  },
  '2': {
    id: '2',
    address: '456 Maple Drive',
    city: 'Mississauga',
    province: 'ON',
    postalCode: 'L5B 3Y7',
    price: 1250000,
    bedrooms: 4,
    bathrooms: 3.5,
    sqft: 2800,
    yearBuilt: 2015,
    parkingSpaces: 2,
    propertyType: 'house',
    description:
      'Beautiful detached family home in a quiet Mississauga neighbourhood. Features a spacious backyard, finished basement, and modern upgrades throughout. Perfect for families seeking space and convenience.',
    features: [
      'Finished basement',
      'Large backyard',
      'Double car garage',
      'Modern kitchen',
      'Hardwood floors',
      'Central air',
    ],
    images: ['/placeholder-property-2.jpg'],
    aiRiskScore: 0.08,
    aiEstimatedValue: 1280000,
    daysOnMarket: 5,
  },
  '3': {
    id: '3',
    address: '789 Yonge Street',
    city: 'North York',
    province: 'ON',
    postalCode: 'M2N 5S3',
    price: 675000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    yearBuilt: 2020,
    parkingSpaces: 1,
    propertyType: 'condo',
    description:
      'Modern 2-bedroom condo with subway access. Newly built with high-end finishes and smart home features. Ideal for young professionals or investors.',
    features: [
      'Smart home ready',
      'Quartz countertops',
      'Built-in closets',
      'Rooftop terrace access',
      'Pet friendly',
      'Bike storage',
    ],
    images: ['/placeholder-property-3.jpg'],
    aiRiskScore: 0.12,
    aiEstimatedValue: 690000,
    daysOnMarket: 21,
  },
};

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PropertyPageProps) {
  const resolvedParams = await params;
  const property = MOCK_PROPERTIES[resolvedParams.id];

  if (!property) {
    return { title: 'Property Not Found' };
  }

  return {
    title: `${property.address}, ${property.city}`,
    description: property.description,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRiskLabel(score: number): { label: string; color: string } {
  if (score <= 0.1) {
    return { label: 'Very Low Risk', color: 'text-success-600 bg-success-50' };
  }
  if (score <= 0.25) {
    return { label: 'Low Risk', color: 'text-success-600 bg-success-50' };
  }
  if (score <= 0.5) {
    return { label: 'Moderate Risk', color: 'text-warning-600 bg-warning-50' };
  }
  return { label: 'Higher Risk', color: 'text-error-600 bg-error-50' };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const resolvedParams = await params;
  const property = MOCK_PROPERTIES[resolvedParams.id];

  if (!property) {
    notFound();
  }

  const riskInfo = getRiskLabel(property.aiRiskScore);
  const location = `${property.city}, ${property.province}`;
  const valueDiff = property.aiEstimatedValue - property.price;
  const valueDiffPercent = ((valueDiff / property.price) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Navigation */}
      <nav className="border-b border-secondary-100 bg-white">
        <div className="container-ease flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Search</span>
            </Link>
            <div className="hidden items-center gap-1 text-sm text-secondary-400 md:flex">
              <Link href="/" className="hover:text-secondary-600">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/search" className="hover:text-secondary-600">
                Search
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-secondary-600">{property.city}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100">
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="container-ease py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Image Placeholder */}
            <div className="aspect-[16/10] rounded-2xl bg-gradient-to-br from-secondary-200 to-secondary-300 flex items-center justify-center">
              <div className="text-center text-secondary-500">
                <div className="text-6xl mb-2">🏠</div>
                <p className="text-sm">Property Images</p>
              </div>
            </div>

            {/* Property Header */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-secondary-900 sm:text-3xl">
                    {property.address}
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-secondary-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {property.city}, {property.province} {property.postalCode}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-bold text-secondary-900">
                    {formatCurrency(property.price)}
                  </div>
                  <div className="mt-1 text-sm text-secondary-500">
                    {property.daysOnMarket} days on market
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-secondary-400" />
                  <span className="font-medium text-secondary-900">{property.bedrooms}</span>
                  <span className="text-secondary-500">Beds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-secondary-400" />
                  <span className="font-medium text-secondary-900">{property.bathrooms}</span>
                  <span className="text-secondary-500">Baths</span>
                </div>
                <div className="flex items-center gap-2">
                  <Maximize className="h-5 w-5 text-secondary-400" />
                  <span className="font-medium text-secondary-900">
                    {property.sqft.toLocaleString()}
                  </span>
                  <span className="text-secondary-500">sqft</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-secondary-400" />
                  <span className="font-medium text-secondary-900">{property.parkingSpaces}</span>
                  <span className="text-secondary-500">Parking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-secondary-400" />
                  <span className="font-medium text-secondary-900">{property.yearBuilt}</span>
                  <span className="text-secondary-500">Built</span>
                </div>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="glass-card">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-secondary-900">
                    AI Risk Assessment
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${riskInfo.color}`}
                    >
                      {riskInfo.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
                      <TrendingUp className="h-4 w-4" />
                      AI Value: {formatCurrency(property.aiEstimatedValue)}
                      <span className="text-primary-500">
                        ({valueDiff >= 0 ? '+' : ''}
                        {valueDiffPercent}%)
                      </span>
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-secondary-600">
                    Based on comparable sales, market trends, and property condition analysis, this
                    property shows {valueDiff >= 0 ? 'potential upside' : 'slight overpricing'}{' '}
                    relative to current market value.
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card">
              <h2 className="font-display text-xl font-semibold text-secondary-900">About This Property</h2>
              <p className="mt-4 leading-relaxed text-secondary-600">{property.description}</p>

              <h3 className="mt-6 font-display text-lg font-semibold text-secondary-900">Features</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {property.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-secondary-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar - Total Cost Calculator */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Total Cost Breakdown - THE MAIN FEATURE */}
              <TotalCostBreakdown
                listingPrice={property.price}
                location={location}
                isFirstTimeBuyer={false}
                propertyType={property.propertyType}
                downPaymentPercent={20}
              />

              {/* CTA Buttons */}
              <div className="card space-y-3">
                <button className="btn-primary w-full">
                  Schedule a Viewing
                </button>
                <button className="btn-secondary w-full">
                  Make an Offer
                </button>
                <p className="text-center text-xs text-secondary-500">
                  Get instant AI-powered offer analysis
                </p>
              </div>

              {/* First-Time Buyer Toggle (Demo) */}
              <div className="card">
                <h3 className="font-display text-sm font-semibold text-secondary-900">
                  Try Different Scenarios
                </h3>
                <p className="mt-1 text-xs text-secondary-500">
                  Toggle first-time buyer status to see potential rebate savings
                </p>
                <div className="mt-3 text-center text-sm text-secondary-400">
                  Interactive controls coming soon...
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
