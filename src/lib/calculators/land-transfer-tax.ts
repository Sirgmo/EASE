/**
 * Land Transfer Tax Calculator
 *
 * Implements Ontario Provincial LTT and Toronto Municipal LTT calculations.
 * Toronto is unique in Canada - it has DOUBLE land transfer tax (provincial + municipal).
 *
 * Provincial LTT Rates (2024):
 * - First $55,000: 0.5%
 * - $55,000 to $250,000: 1.0%
 * - $250,000 to $400,000: 1.5%
 * - $400,000 to $2,000,000: 2.0%
 * - Over $2,000,000: 2.5%
 *
 * Toronto Municipal LTT Rates (mirrors provincial):
 * - First $55,000: 0.5%
 * - $55,000 to $250,000: 1.0%
 * - $250,000 to $400,000: 1.5%
 * - $400,000 to $2,000,000: 2.0%
 * - Over $2,000,000: 2.5%
 *
 * First-Time Home Buyer Rebates:
 * - Provincial: Up to $4,000
 * - Toronto: Up to $4,475
 */

export interface LTTBreakdown {
  provincialLTT: number;
  municipalLTT: number;
  totalLTT: number;
  provincialRebate: number;
  municipalRebate: number;
  totalRebate: number;
  netLTT: number;
  isToronto: boolean;
  isFirstTimeBuyer: boolean;
}

export interface LTTCalculationInput {
  purchasePrice: number;
  location: string;
  isFirstTimeBuyer?: boolean;
}

/**
 * Ontario Provincial LTT brackets
 */
const PROVINCIAL_LTT_BRACKETS = [
  { threshold: 55000, rate: 0.005 },
  { threshold: 250000, rate: 0.01 },
  { threshold: 400000, rate: 0.015 },
  { threshold: 2000000, rate: 0.02 },
  { threshold: Infinity, rate: 0.025 },
];

/**
 * Toronto Municipal LTT brackets (same as provincial)
 */
const TORONTO_LTT_BRACKETS = [
  { threshold: 55000, rate: 0.005 },
  { threshold: 250000, rate: 0.01 },
  { threshold: 400000, rate: 0.015 },
  { threshold: 2000000, rate: 0.02 },
  { threshold: Infinity, rate: 0.025 },
];

/**
 * Maximum rebates available
 */
const MAX_PROVINCIAL_REBATE = 4000;
const MAX_TORONTO_REBATE = 4475;

/**
 * Locations that are considered part of Toronto for municipal LTT purposes
 */
const TORONTO_LOCATIONS = [
  'toronto',
  'north york',
  'scarborough',
  'etobicoke',
  'york',
  'east york',
  'downtown toronto',
  'midtown toronto',
  'uptown toronto',
];

/**
 * Calculate LTT using marginal bracket system
 */
function calculateMarginalLTT(
  purchasePrice: number,
  brackets: { threshold: number; rate: number }[]
): number {
  let tax = 0;
  let previousThreshold = 0;

  for (const bracket of brackets) {
    if (purchasePrice <= previousThreshold) {
      break;
    }

    const taxableAmount = Math.min(purchasePrice, bracket.threshold) - previousThreshold;
    if (taxableAmount > 0) {
      tax += taxableAmount * bracket.rate;
    }

    previousThreshold = bracket.threshold;
  }

  return Math.round(tax * 100) / 100; // Round to cents
}

/**
 * Check if location is in Toronto (for municipal LTT)
 */
export function isToronto(location: string): boolean {
  const normalizedLocation = location.toLowerCase().trim();
  return TORONTO_LOCATIONS.some(
    (torontoLocation) =>
      normalizedLocation.includes(torontoLocation) ||
      normalizedLocation === 'toronto, on' ||
      normalizedLocation === 'toronto, ontario'
  );
}

/**
 * Calculate First-Time Home Buyer rebate
 * The rebate is the lesser of:
 * 1. The actual LTT paid
 * 2. The maximum rebate amount
 */
function calculateRebate(lttAmount: number, maxRebate: number): number {
  return Math.min(lttAmount, maxRebate);
}

/**
 * Main LTT calculation function
 */
export function calculateLandTransferTax(input: LTTCalculationInput): LTTBreakdown {
  const { purchasePrice, location, isFirstTimeBuyer = false } = input;

  const isTorontoLocation = isToronto(location);

  // Calculate Provincial LTT (applies everywhere in Ontario)
  const provincialLTT = calculateMarginalLTT(purchasePrice, PROVINCIAL_LTT_BRACKETS);

  // Calculate Toronto Municipal LTT (only in Toronto)
  const municipalLTT = isTorontoLocation
    ? calculateMarginalLTT(purchasePrice, TORONTO_LTT_BRACKETS)
    : 0;

  // Calculate rebates if first-time buyer
  const provincialRebate = isFirstTimeBuyer
    ? calculateRebate(provincialLTT, MAX_PROVINCIAL_REBATE)
    : 0;

  const municipalRebate =
    isFirstTimeBuyer && isTorontoLocation ? calculateRebate(municipalLTT, MAX_TORONTO_REBATE) : 0;

  const totalLTT = provincialLTT + municipalLTT;
  const totalRebate = provincialRebate + municipalRebate;
  const netLTT = totalLTT - totalRebate;

  return {
    provincialLTT,
    municipalLTT,
    totalLTT,
    provincialRebate,
    municipalRebate,
    totalRebate,
    netLTT,
    isToronto: isTorontoLocation,
    isFirstTimeBuyer,
  };
}

/**
 * Format currency for display
 */
export function formatLTTCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get a human-readable summary of the LTT
 */
export function getLTTSummary(breakdown: LTTBreakdown): string {
  if (breakdown.isToronto) {
    return `Toronto Double LTT: ${formatLTTCurrency(breakdown.provincialLTT)} (Provincial) + ${formatLTTCurrency(breakdown.municipalLTT)} (Municipal)`;
  }
  return `Ontario LTT: ${formatLTTCurrency(breakdown.provincialLTT)}`;
}
