// src/app/(dashboard)/calculator/page.tsx
// Standalone calculator page — accessible without selecting a specific property.
// Useful at the beginning of a property search to understand full cost of ownership.

import { LTTCalculator } from '@/components/calculator/LTTCalculator'

export const metadata = {
  title: 'Closing Cost Calculator | Ease',
  description:
    'Estimate Ontario land transfer tax (provincial + Toronto municipal), first-time buyer rebates, and all closing costs upfront.',
}

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-secondary-900">
          Closing Cost Calculator
        </h1>
        <p className="mt-2 text-secondary-500">
          Estimate Ontario land transfer tax (provincial + Toronto municipal), first-time buyer
          rebates, and all closing costs upfront — before making any commitment.
        </p>
      </div>
      <LTTCalculator />
    </div>
  )
}
