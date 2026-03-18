'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  HelpCircle,
  Home,
  Info,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  calculateTotalCostSummary,
  type ClosingCostItem,
  type TotalCostSummary,
} from '@/lib/calculators';
import { DonutChart, DonutChartLegend, type DonutChartSegment } from './DonutChart';

export interface TotalCostBreakdownProps {
  listingPrice: number;
  location: string;
  downPaymentPercent?: number;
  isFirstTimeBuyer?: boolean;
  propertyType?: 'house' | 'condo';
  className?: string;
}

/**
 * Format currency in CAD
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get category color for chart
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    tax: '#ef4444', // Red
    legal: '#3b82f6', // Blue
    inspection: '#f59e0b', // Amber
    adjustment: '#8b5cf6', // Purple
    insurance: '#10b981', // Emerald
    other: '#6b7280', // Gray
  };
  return colors[category] ?? '#6b7280';
}

/**
 * Get category label
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tax: 'Taxes & Duties',
    legal: 'Legal Fees',
    inspection: 'Inspections',
    adjustment: 'Adjustments',
    insurance: 'Insurance',
    other: 'Other',
  };
  return labels[category] ?? 'Other';
}

/**
 * Cost Line Item Component
 */
function CostLineItem({
  item,
  isExpanded,
}: {
  item: ClosingCostItem;
  isExpanded?: boolean;
}) {
  const isNegative = item.amount < 0;

  return (
    <div
      className={cn(
        'flex items-center justify-between py-2',
        isExpanded ? 'border-b border-secondary-100 last:border-0' : ''
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: getCategoryColor(item.category) }}
        />
        <span className="text-sm text-secondary-700">{item.label}</span>
        {item.isEstimate && (
          <span className="rounded bg-secondary-100 px-1.5 py-0.5 text-xs text-secondary-500">
            Est.
          </span>
        )}
        {item.tooltip && (
          <div className="group relative">
            <HelpCircle className="h-3.5 w-3.5 cursor-help text-secondary-400" />
            <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden w-48 -translate-x-1/2 rounded-lg bg-secondary-900 p-2 text-xs text-white shadow-lg group-hover:block">
              {item.tooltip}
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-secondary-900" />
            </div>
          </div>
        )}
      </div>
      <span
        className={cn(
          'font-medium',
          isNegative ? 'text-success-600' : 'text-secondary-900'
        )}
      >
        {isNegative ? '-' : ''}
        {formatCurrency(Math.abs(item.amount))}
      </span>
    </div>
  );
}

/**
 * TotalCostBreakdown Component
 *
 * The flagship "AI-First Transparency" feature.
 * Shows total cost to close at the TOP, with detailed breakdown below.
 */
export function TotalCostBreakdown({
  listingPrice,
  location,
  downPaymentPercent = 20,
  isFirstTimeBuyer = false,
  propertyType = 'house',
  className,
}: TotalCostBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllCosts, setShowAllCosts] = useState(false);

  // Calculate all costs
  const summary: TotalCostSummary = useMemo(
    () =>
      calculateTotalCostSummary({
        purchasePrice: listingPrice,
        location,
        isFirstTimeBuyer,
        downPaymentPercent,
        propertyType,
      }),
    [listingPrice, location, isFirstTimeBuyer, downPaymentPercent, propertyType]
  );

  const { closingCosts, totalCashRequired, downPayment, mortgageAmount, monthlyMortgageEstimate } =
    summary;
  const { items, lttBreakdown, totalClosingCosts } = closingCosts;

  // Prepare donut chart data
  const chartSegments: DonutChartSegment[] = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    for (const item of items) {
      if (item.amount > 0) {
        categoryTotals[item.category] = (categoryTotals[item.category] ?? 0) + item.amount;
      }
    }

    return Object.entries(categoryTotals).map(([category, value]) => ({
      id: category,
      label: getCategoryLabel(category),
      value,
      color: getCategoryColor(category),
    }));
  }, [items]);

  // Calculate savings if first-time buyer
  const potentialSavings = isFirstTimeBuyer ? 0 : lttBreakdown.provincialRebate + (lttBreakdown.isToronto ? lttBreakdown.municipalRebate : 0);

  return (
    <div className={cn('rounded-2xl border border-secondary-100 bg-white shadow-elevation-2', className)}>
      {/* Header - Total Cost FIRST */}
      <div className="rounded-t-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-200" />
              <span className="text-sm font-medium text-primary-100">AI-Powered Estimate</span>
            </div>
            <h2 className="mt-1 text-lg font-medium text-primary-100">Real Cost to Close</h2>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl font-bold">{formatCurrency(totalCashRequired)}</div>
            <div className="mt-1 text-sm text-primary-200">Total cash needed</div>
          </div>
        </div>

        {/* Toronto Double LTT Badge */}
        {lttBreakdown.isToronto && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            <span className="text-sm font-medium">Toronto Double LTT Applied</span>
            <span className="ml-auto text-sm text-primary-200">
              +{formatCurrency(lttBreakdown.municipalLTT)} municipal tax
            </span>
          </div>
        )}

        {/* First-Time Buyer Savings */}
        {isFirstTimeBuyer && lttBreakdown.totalRebate > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-success-500/20 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-success-300" />
            <span className="text-sm font-medium">First-Time Buyer Rebate Applied</span>
            <span className="ml-auto text-sm text-success-200">
              Saving {formatCurrency(lttBreakdown.totalRebate)}
            </span>
          </div>
        )}

        {/* Potential Savings Hint */}
        {!isFirstTimeBuyer && potentialSavings > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <Info className="h-4 w-4 text-primary-200" />
            <span className="text-sm text-primary-200">
              First-time buyers could save up to {formatCurrency(potentialSavings)} in rebates
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-secondary-100 border-b border-secondary-100">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-secondary-500">
            <Home className="h-4 w-4" />
            <span className="text-xs">Purchase Price</span>
          </div>
          <div className="mt-1 font-display text-lg font-bold text-secondary-900">
            {formatCurrency(listingPrice)}
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-secondary-500">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Down Payment ({downPaymentPercent}%)</span>
          </div>
          <div className="mt-1 font-display text-lg font-bold text-secondary-900">
            {formatCurrency(downPayment)}
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-secondary-500">
            <MapPin className="h-4 w-4" />
            <span className="text-xs">Closing Costs</span>
          </div>
          <div className="mt-1 font-display text-lg font-bold text-primary-600">
            {formatCurrency(totalClosingCosts)}
          </div>
        </div>
      </div>

      {/* Expandable Details Section */}
      <div className="p-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-display text-lg font-semibold text-secondary-900">
            Closing Cost Breakdown
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-secondary-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-secondary-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            {/* Donut Chart */}
            <div className="flex flex-col items-center">
              <DonutChart
                segments={chartSegments}
                size={180}
                strokeWidth={28}
                centerLabel="Total Fees"
                centerValue={formatCurrency(
                  chartSegments.reduce((sum, seg) => sum + seg.value, 0)
                )}
              />
              <DonutChartLegend
                segments={chartSegments}
                total={chartSegments.reduce((sum, seg) => sum + seg.value, 0)}
                formatValue={formatCurrency}
                className="mt-6 w-full"
              />
            </div>

            {/* Itemized List */}
            <div>
              <div className="space-y-1">
                {(showAllCosts ? items : items.slice(0, 5)).map((item) => (
                  <CostLineItem key={item.id} item={item} isExpanded />
                ))}
              </div>

              {items.length > 5 && (
                <button
                  onClick={() => setShowAllCosts(!showAllCosts)}
                  className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {showAllCosts ? 'Show less' : `Show all ${items.length} items`}
                </button>
              )}

              {/* Total Line */}
              <div className="mt-4 flex items-center justify-between border-t border-secondary-200 pt-4">
                <span className="font-semibold text-secondary-900">Total Closing Costs</span>
                <span className="font-display text-xl font-bold text-secondary-900">
                  {formatCurrency(totalClosingCosts)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Payment Estimate */}
      {monthlyMortgageEstimate && monthlyMortgageEstimate > 0 && (
        <div className="border-t border-secondary-100 bg-secondary-50 p-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-secondary-600">Estimated Monthly Payment</span>
              <p className="text-xs text-secondary-400">
                Based on {formatCurrency(mortgageAmount)} mortgage at 5% over 25 years
              </p>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl font-bold text-secondary-900">
                {formatCurrency(monthlyMortgageEstimate)}
              </span>
              <span className="text-sm text-secondary-500">/month</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
