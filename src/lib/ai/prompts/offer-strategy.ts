// src/lib/ai/prompts/offer-strategy.ts
// Pure function — no side effects.

export interface ComparableSale {
  address: string
  salePrice: number
  listPrice: number
  soldDate: string
  squareFootage?: number | undefined
  bedrooms: number
  bathrooms: number
  daysOnMarket: number
}

export interface ListingData {
  mlsNumber: string
  address: string
  listPrice: number
  propertyType: string
  bedrooms: number
  bathrooms: number
  squareFootage?: number | undefined
  daysOnMarket: number
  neighbourhood: string
}

export function buildOfferStrategyPrompt(
  listing: ListingData,
  comps: ComparableSale[]
): string {
  const compsText = comps
    .map(
      (c, i) =>
        `Comp ${i + 1}: ${c.address} — Listed $${c.listPrice.toLocaleString('en-CA')}, Sold $${c.salePrice.toLocaleString('en-CA')} (${c.daysOnMarket} DOM, ${c.soldDate})`
    )
    .join('\n')

  return `You are an offer strategy advisor for a Canadian real estate buyer. Provide pricing strategy guidance based on the subject property and comparable sales.

Subject Property:
- MLS: ${listing.mlsNumber}
- Address: ${listing.address}
- List Price: $${listing.listPrice.toLocaleString('en-CA')}
- Type: ${listing.propertyType}
- ${listing.bedrooms}BR / ${listing.bathrooms}BA
${listing.squareFootage ? `- ${listing.squareFootage} sq ft` : ''}
- Days on Market: ${listing.daysOnMarket}
- Neighbourhood: ${listing.neighbourhood}

Comparable Sales (last 90 days):
${compsText || 'No comparables available — use list price as reference only.'}

Based on these comparables, provide:
1. A recommended offer PRICE RANGE (low end and high end) — NEVER a single price
2. The sale-to-list ratio implied by the comps
3. Key negotiation context (seller motivation signals, market conditions)
4. 2-3 conditions you would recommend including (financing, inspection, status certificate if applicable)

CRITICAL: Always state a price RANGE. Never recommend a single offer price.
Do not provide legal advice. Do not recommend waiving conditions — that is the buyer's decision.`
}
