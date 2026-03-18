/**
 * Closing Costs Calculator
 *
 * Calculates all costs required to close a real estate transaction.
 * Designed for Ontario, Canada market.
 */

import {
  calculateLandTransferTax,
  type LTTBreakdown,
  type LTTCalculationInput,
} from './land-transfer-tax';

export interface ClosingCostItem {
  id: string;
  label: string;
  amount: number;
  description: string;
  category: 'tax' | 'legal' | 'inspection' | 'adjustment' | 'insurance' | 'other';
  isEstimate: boolean;
  tooltip?: string;
}

export interface ClosingCostsBreakdown {
  items: ClosingCostItem[];
  subtotalByCategory: Record<string, number>;
  totalClosingCosts: number;
  lttBreakdown: LTTBreakdown;
}

export interface TotalCostSummary {
  purchasePrice: number;
  downPayment: number;
  downPaymentPercent: number;
  mortgageAmount: number;
  closingCosts: ClosingCostsBreakdown;
  totalCashRequired: number;
  monthlyMortgageEstimate?: number;
}

export interface ClosingCostInput {
  purchasePrice: number;
  location: string;
  isFirstTimeBuyer?: boolean;
  downPaymentPercent?: number;
  includeHomeInspection?: boolean;
  includeTitleInsurance?: boolean;
  propertyType?: 'house' | 'condo';
}

/**
 * Standard closing cost estimates for Ontario
 */
const CLOSING_COST_ESTIMATES = {
  legalFees: {
    base: 1500,
    disbursements: 300,
  },
  homeInspection: 500,
  titleInsurance: {
    // Approximate based on purchase price
    ratePerThousand: 0.5,
    minimum: 250,
    maximum: 800,
  },
  closingAdjustments: 1000, // Prepaid property taxes, utilities, etc.
  moveInCosts: 500, // Not included by default but available
  appraisalFee: 350, // If required by lender
  statusCertificate: 100, // For condos
};

/**
 * Calculate title insurance cost
 */
function calculateTitleInsurance(purchasePrice: number): number {
  const cost = (purchasePrice / 1000) * CLOSING_COST_ESTIMATES.titleInsurance.ratePerThousand;
  return Math.max(
    CLOSING_COST_ESTIMATES.titleInsurance.minimum,
    Math.min(cost, CLOSING_COST_ESTIMATES.titleInsurance.maximum)
  );
}

/**
 * Calculate all closing costs
 */
export function calculateClosingCosts(input: ClosingCostInput): ClosingCostsBreakdown {
  const {
    purchasePrice,
    location,
    isFirstTimeBuyer = false,
    includeHomeInspection = true,
    includeTitleInsurance = true,
    propertyType = 'house',
  } = input;

  // Calculate LTT
  const lttInput: LTTCalculationInput = {
    purchasePrice,
    location,
    isFirstTimeBuyer,
  };
  const lttBreakdown = calculateLandTransferTax(lttInput);

  const items: ClosingCostItem[] = [];

  // Land Transfer Tax (Provincial)
  items.push({
    id: 'provincial-ltt',
    label: 'Ontario Land Transfer Tax',
    amount: lttBreakdown.provincialLTT,
    description: 'Provincial tax on property transfer',
    category: 'tax',
    isEstimate: false,
    tooltip: 'Calculated using Ontario marginal tax brackets',
  });

  // Toronto Municipal LTT (if applicable)
  if (lttBreakdown.isToronto) {
    items.push({
      id: 'municipal-ltt',
      label: 'Toronto Municipal LTT',
      amount: lttBreakdown.municipalLTT,
      description: 'Additional city tax for Toronto properties',
      category: 'tax',
      isEstimate: false,
      tooltip: 'Toronto is the only city in Canada with a municipal land transfer tax',
    });
  }

  // First-Time Buyer Rebates
  if (isFirstTimeBuyer && lttBreakdown.provincialRebate > 0) {
    items.push({
      id: 'provincial-rebate',
      label: 'First-Time Buyer Rebate (Provincial)',
      amount: -lttBreakdown.provincialRebate,
      description: 'Up to $4,000 rebate for first-time buyers',
      category: 'tax',
      isEstimate: false,
    });
  }

  if (isFirstTimeBuyer && lttBreakdown.municipalRebate > 0) {
    items.push({
      id: 'municipal-rebate',
      label: 'First-Time Buyer Rebate (Toronto)',
      amount: -lttBreakdown.municipalRebate,
      description: 'Up to $4,475 rebate for first-time buyers',
      category: 'tax',
      isEstimate: false,
    });
  }

  // Legal Fees
  items.push({
    id: 'legal-fees',
    label: 'Legal Fees & Disbursements',
    amount: CLOSING_COST_ESTIMATES.legalFees.base + CLOSING_COST_ESTIMATES.legalFees.disbursements,
    description: 'Real estate lawyer fees and registration costs',
    category: 'legal',
    isEstimate: true,
    tooltip: 'Includes title search, document preparation, and registration',
  });

  // Home Inspection
  if (includeHomeInspection) {
    items.push({
      id: 'home-inspection',
      label: 'Home Inspection',
      amount: CLOSING_COST_ESTIMATES.homeInspection,
      description: 'Professional property inspection',
      category: 'inspection',
      isEstimate: true,
    });
  }

  // Title Insurance
  if (includeTitleInsurance) {
    items.push({
      id: 'title-insurance',
      label: 'Title Insurance',
      amount: calculateTitleInsurance(purchasePrice),
      description: 'Protects against title defects',
      category: 'insurance',
      isEstimate: true,
    });
  }

  // Closing Adjustments
  items.push({
    id: 'closing-adjustments',
    label: 'Closing Adjustments',
    amount: CLOSING_COST_ESTIMATES.closingAdjustments,
    description: 'Prepaid property taxes, utilities, condo fees',
    category: 'adjustment',
    isEstimate: true,
    tooltip: 'Reimbursement to seller for prepaid expenses',
  });

  // Condo Status Certificate (if applicable)
  if (propertyType === 'condo') {
    items.push({
      id: 'status-certificate',
      label: 'Status Certificate',
      amount: CLOSING_COST_ESTIMATES.statusCertificate,
      description: 'Required document for condo purchases',
      category: 'legal',
      isEstimate: false,
    });
  }

  // Calculate subtotals by category
  const subtotalByCategory: Record<string, number> = {};
  for (const item of items) {
    subtotalByCategory[item.category] = (subtotalByCategory[item.category] ?? 0) + item.amount;
  }

  // Calculate total
  const totalClosingCosts = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    items,
    subtotalByCategory,
    totalClosingCosts,
    lttBreakdown,
  };
}

/**
 * Calculate total cost summary including down payment
 */
export function calculateTotalCostSummary(input: ClosingCostInput): TotalCostSummary {
  const { purchasePrice, downPaymentPercent = 20 } = input;

  const closingCosts = calculateClosingCosts(input);

  const downPayment = Math.round(purchasePrice * (downPaymentPercent / 100));
  const mortgageAmount = purchasePrice - downPayment;
  const totalCashRequired = downPayment + closingCosts.totalClosingCosts;

  // Simple monthly mortgage estimate (5% rate, 25 year amortization)
  const monthlyRate = 0.05 / 12;
  const numPayments = 25 * 12;
  const monthlyMortgageEstimate =
    mortgageAmount > 0
      ? Math.round(
          (mortgageAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
            (Math.pow(1 + monthlyRate, numPayments) - 1)
        )
      : 0;

  return {
    purchasePrice,
    downPayment,
    downPaymentPercent,
    mortgageAmount,
    closingCosts,
    totalCashRequired,
    monthlyMortgageEstimate,
  };
}
