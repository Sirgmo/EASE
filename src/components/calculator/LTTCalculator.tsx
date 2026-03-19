'use client'
// src/components/calculator/LTTCalculator.tsx
// Client component — real-time LTT + closing cost breakdown without server roundtrip
// Brackets are hardcoded here matching the DB seed values (same source of truth).
// If rates change, update both the DB seed and these constants.

import { useState } from 'react'
import { calculateLTT, type LTTBracket } from '@/lib/ltt'
import { estimateClosingCosts } from '@/lib/closing-costs'

// Ontario standard brackets (stable since 2017, source: ontario.ca)
const ONTARIO_BRACKETS: LTTBracket[] = [
  { thresholdFrom: 0, thresholdTo: 55_000, rate: 0.005 },
  { thresholdFrom: 55_000, thresholdTo: 250_000, rate: 0.010 },
  { thresholdFrom: 250_000, thresholdTo: 400_000, rate: 0.015 },
  { thresholdFrom: 400_000, thresholdTo: 2_000_000, rate: 0.020 },
  { thresholdFrom: 2_000_000, thresholdTo: null, rate: 0.025 },
]

// Ontario condo brackets (no 2.5% tier — condos stay at 2%)
const ONTARIO_CONDO_BRACKETS: LTTBracket[] = [
  { thresholdFrom: 0, thresholdTo: 55_000, rate: 0.005 },
  { thresholdFrom: 55_000, thresholdTo: 250_000, rate: 0.010 },
  { thresholdFrom: 250_000, thresholdTo: 400_000, rate: 0.015 },
  { thresholdFrom: 400_000, thresholdTo: 2_000_000, rate: 0.020 },
  { thresholdFrom: 2_000_000, thresholdTo: null, rate: 0.020 }, // Condos stay at 2%
]

// Toronto MLTT including luxury brackets (effective April 1, 2026, source: toronto.ca)
const TORONTO_BRACKETS: LTTBracket[] = [
  { thresholdFrom: 0, thresholdTo: 55_000, rate: 0.005 },
  { thresholdFrom: 55_000, thresholdTo: 250_000, rate: 0.010 },
  { thresholdFrom: 250_000, thresholdTo: 400_000, rate: 0.015 },
  { thresholdFrom: 400_000, thresholdTo: 2_000_000, rate: 0.020 },
  { thresholdFrom: 2_000_000, thresholdTo: 3_000_000, rate: 0.025 },
  { thresholdFrom: 3_000_000, thresholdTo: 4_000_000, rate: 0.044 },
  { thresholdFrom: 4_000_000, thresholdTo: 5_000_000, rate: 0.0545 },
  { thresholdFrom: 5_000_000, thresholdTo: 10_000_000, rate: 0.065 },
  { thresholdFrom: 10_000_000, thresholdTo: 20_000_000, rate: 0.0755 },
  { thresholdFrom: 20_000_000, thresholdTo: null, rate: 0.086 },
]

export function LTTCalculator() {
  const [purchasePrice, setPurchasePrice] = useState<string>('800000')
  const [isToronto, setIsToronto] = useState(true)
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false)
  const [propertyType, setPropertyType] = useState<'residential' | 'condo'>('residential')

  const price = Number(purchasePrice.replace(/,/g, '')) || 0

  const provincialBrackets = propertyType === 'condo' ? ONTARIO_CONDO_BRACKETS : ONTARIO_BRACKETS
  const torontoBrackets = isToronto ? TORONTO_BRACKETS : null

  const ltt = calculateLTT(price, provincialBrackets, torontoBrackets, isFirstTimeBuyer)
  const closing = estimateClosingCosts(price)

  const grandTotalLow = ltt.netLTT + closing.totalLow
  const grandTotalHigh = ltt.netLTT + closing.totalHigh

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="rounded-2xl border border-secondary-100 bg-white p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-secondary-900">Property Details</h2>
        <div>
          <label className="block text-sm font-medium text-secondary-700">Purchase Price</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">$</span>
            <input
              type="text"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full rounded-xl border border-secondary-200 py-2 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="800,000"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isToronto}
              onChange={(e) => setIsToronto(e.target.checked)}
              className="rounded"
            />
            <span className="text-secondary-700">Property is in Toronto (double LTT)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isFirstTimeBuyer}
              onChange={(e) => setIsFirstTimeBuyer(e.target.checked)}
              className="rounded"
            />
            <span className="text-secondary-700">First-time buyer</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700">Property Type</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as 'residential' | 'condo')}
            className="mt-1 rounded-xl border border-secondary-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="residential">House / Semi-Detached / Townhouse</option>
            <option value="condo">Condo / Apartment</option>
          </select>
        </div>
      </div>

      {/* LTT breakdown */}
      {price > 0 && (
        <div className="rounded-2xl border border-secondary-100 bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-secondary-900">Land Transfer Tax</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-secondary-600">Ontario Provincial LTT</dt>
              <dd className="font-semibold text-secondary-900">{fmt(ltt.provincialLTT)}</dd>
            </div>
            {isToronto && (
              <div className="flex justify-between">
                <dt className="text-secondary-600">Toronto Municipal LTT</dt>
                <dd className="font-semibold text-secondary-900">{fmt(ltt.municipalLTT)}</dd>
              </div>
            )}
            {ltt.provincialRebate > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>Ontario First-Time Buyer Rebate</dt>
                <dd className="font-semibold">-{fmt(ltt.provincialRebate)}</dd>
              </div>
            )}
            {ltt.municipalRebate > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>Toronto First-Time Buyer Rebate</dt>
                <dd className="font-semibold">-{fmt(ltt.municipalRebate)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-secondary-100 pt-3 font-bold">
              <dt className="text-secondary-900">Net Land Transfer Tax</dt>
              <dd className="text-primary-600">{fmt(ltt.netLTT)}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Closing cost breakdown */}
      {price > 0 && (
        <div className="rounded-2xl border border-secondary-100 bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-secondary-900">Other Closing Costs</h2>
          <p className="text-xs text-secondary-400">
            Estimates only — actual amounts vary. Consult your lawyer for exact figures.
          </p>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-secondary-600">Legal Fees</dt>
              <dd className="font-semibold text-secondary-900">
                {fmt(closing.legalFeesLow)} - {fmt(closing.legalFeesHigh)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-secondary-600">Title Insurance</dt>
              <dd className="font-semibold text-secondary-900">
                {fmt(closing.titleInsuranceLow)} - {fmt(closing.titleInsuranceHigh)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-secondary-600">Home Inspection</dt>
              <dd className="font-semibold text-secondary-900">
                {fmt(closing.inspectionLow)} - {fmt(closing.inspectionHigh)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-secondary-100 pt-3 font-bold">
              <dt className="text-secondary-900">Total (excl. LTT)</dt>
              <dd className="text-secondary-900">
                {fmt(closing.totalLow)} - {fmt(closing.totalHigh)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Grand total */}
      {price > 0 && (
        <div className="rounded-2xl bg-primary-600 p-6 text-white">
          <h2 className="font-display text-lg font-semibold">Estimated Total Closing Costs</h2>
          <p className="mt-2 text-3xl font-bold">
            {fmt(grandTotalLow)} - {fmt(grandTotalHigh)}
          </p>
          <p className="mt-1 text-sm text-primary-200">
            Land transfer tax + legal fees + title insurance + inspection.
            Does not include HST, mortgage insurance, or property tax adjustments.
          </p>
        </div>
      )}
    </div>
  )
}
