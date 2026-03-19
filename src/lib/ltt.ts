// src/lib/ltt.ts
// Pure LTT calculation engine — no side effects, no DB calls, no env imports
// Source: Ontario.ca land transfer tax rates + toronto.ca MLTT (verified March 2026)
// Brackets are PASSED IN as parameters (not hardcoded here) so DB-driven brackets work at runtime

export interface LTTBracket {
  thresholdFrom: number
  thresholdTo: number | null  // null = infinity (no upper bound)
  rate: number
}

export interface LTTResult {
  provincialLTT: number
  municipalLTT: number        // 0 if not Toronto
  totalLTT: number
  provincialRebate: number    // Ontario first-time buyer rebate, capped at $4,000
  municipalRebate: number     // Toronto first-time buyer rebate, capped at $4,475
  netLTT: number              // totalLTT - provincialRebate - municipalRebate
}

/**
 * Calculate marginal tax using bracket array.
 * Iterates brackets bottom-up, computing taxable slice per bracket.
 */
export function calculateMarginalTax(purchasePrice: number, brackets: LTTBracket[]): number {
  let tax = 0

  for (const bracket of brackets) {
    if (purchasePrice <= bracket.thresholdFrom) break
    const upperBound = bracket.thresholdTo ?? Infinity
    const taxableAmount = Math.min(purchasePrice, upperBound) - bracket.thresholdFrom
    tax += taxableAmount * bracket.rate
  }

  // Round to cents
  return Math.round(tax * 100) / 100
}

/**
 * Calculate LTT for a property purchase.
 *
 * @param purchasePrice - Purchase price in dollars
 * @param provincialBrackets - Ontario brackets (pass from DB or use defaults)
 * @param torontoBrackets - Toronto MLTT brackets; pass null if not a Toronto property
 * @param isFirstTimeBuyer - Eligibility for first-time buyer rebates
 */
export function calculateLTT(
  purchasePrice: number,
  provincialBrackets: LTTBracket[],
  torontoBrackets: LTTBracket[] | null,
  isFirstTimeBuyer: boolean,
): LTTResult {
  const provincialLTT = calculateMarginalTax(purchasePrice, provincialBrackets)
  const municipalLTT = torontoBrackets
    ? calculateMarginalTax(purchasePrice, torontoBrackets)
    : 0

  // Ontario first-time buyer rebate: up to $4,000 cap
  const provincialRebate = isFirstTimeBuyer ? Math.min(provincialLTT, 4_000) : 0

  // Toronto MLTT first-time buyer rebate: up to $4,475 cap (covers full MLTT <= $400k)
  const municipalRebate = isFirstTimeBuyer && torontoBrackets
    ? Math.min(municipalLTT, 4_475)
    : 0

  const totalLTT = provincialLTT + municipalLTT
  const netLTT = Math.max(0, totalLTT - provincialRebate - municipalRebate)

  return {
    provincialLTT,
    municipalLTT,
    totalLTT,
    provincialRebate,
    municipalRebate,
    netLTT,
  }
}
