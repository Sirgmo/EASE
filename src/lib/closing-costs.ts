// src/lib/closing-costs.ts
// Closing cost estimator — Ontario 2026 ranges (source: verified market data)
// All estimates are ranges, not guarantees. Display with "approximately" language.

export interface ClosingCostEstimate {
  legalFeesLow: number        // $1,500
  legalFeesHigh: number       // $2,500
  titleInsuranceLow: number   // $200
  titleInsuranceHigh: number  // $500
  inspectionLow: number       // $300
  inspectionHigh: number      // $600
  totalLow: number            // Sum of all low estimates
  totalHigh: number           // Sum of all high estimates
}

/**
 * Estimate closing costs for a property purchase in Ontario.
 * Range values are 2026 Ontario market rates. Does not include LTT (calculated separately).
 *
 * @param purchasePrice - Purchase price (reserved for future title insurance % calculation)
 */
export function estimateClosingCosts(purchasePrice: number): ClosingCostEstimate {
  // v1: flat ranges (not purchase-price-dependent for legal/inspection)
  // Title insurance is sometimes % of purchase price but flat range is standard for estimates
  void purchasePrice // Future: use for title insurance % calculation

  const legalFeesLow = 1_500
  const legalFeesHigh = 2_500
  const titleInsuranceLow = 200
  const titleInsuranceHigh = 500
  const inspectionLow = 300
  const inspectionHigh = 600

  return {
    legalFeesLow,
    legalFeesHigh,
    titleInsuranceLow,
    titleInsuranceHigh,
    inspectionLow,
    inspectionHigh,
    totalLow: legalFeesLow + titleInsuranceLow + inspectionLow,
    totalHigh: legalFeesHigh + titleInsuranceHigh + inspectionHigh,
  }
}
