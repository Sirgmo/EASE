'use client'
// src/components/transaction/OfferForm.tsx
// OREA Form 100 field capture form — buyer fills this out, partner reviews and submits

import { useState } from 'react'

interface OfferFormProps {
  transactionId: string
  mlsNumber: string
  onSubmit?: () => void
}

interface FormState {
  purchasePrice: string
  deposit: string
  irrevocabilityDeadline: string
  completionDate: string
  financingConditionDays: string
  inspectionConditionDays: string
  chattelsIncluded: string
  fixturesExcluded: string
  rentalItems: string
}

const initialFormState: FormState = {
  purchasePrice: '',
  deposit: '',
  irrevocabilityDeadline: '',
  completionDate: '',
  financingConditionDays: '',
  inspectionConditionDays: '',
  chattelsIncluded: '',
  fixturesExcluded: '',
  rentalItems: '',
}

export function OfferForm({ transactionId, mlsNumber, onSubmit }: OfferFormProps) {
  const [form, setForm] = useState<FormState>(initialFormState)
  const [status, setStatus] = useState<'idle' | 'saving' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [clientErrors, setClientErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear individual field error on change
    if (clientErrors[name as keyof FormState]) {
      setClientErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {}
    const price = parseFloat(form.purchasePrice)
    if (!form.purchasePrice || isNaN(price) || price <= 0) {
      errors.purchasePrice = 'Purchase price must be greater than $0'
    }
    if (!form.completionDate) {
      errors.completionDate = 'Completion date is required'
    }
    setClientErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSave(isSubmitForReview: boolean) {
    if (!validate()) return

    setStatus(isSubmitForReview ? 'submitting' : 'saving')
    setMessage(null)

    // Convert dollar inputs to cents (multiply by 100)
    const purchasePriceCents = Math.round(parseFloat(form.purchasePrice) * 100)
    const depositCents = form.deposit ? Math.round(parseFloat(form.deposit) * 100) : undefined

    const payload: Record<string, unknown> = {
      transactionId,
      purchasePrice: purchasePriceCents,
      deposit: depositCents,
      completionDate: form.completionDate ? new Date(form.completionDate).toISOString() : undefined,
      irrevocabilityDeadline: form.irrevocabilityDeadline
        ? new Date(form.irrevocabilityDeadline).toISOString()
        : undefined,
      financingConditionDays: form.financingConditionDays
        ? parseInt(form.financingConditionDays, 10)
        : undefined,
      inspectionConditionDays: form.inspectionConditionDays
        ? parseInt(form.inspectionConditionDays, 10)
        : undefined,
      chattelsIncluded: form.chattelsIncluded || undefined,
      fixturesExcluded: form.fixturesExcluded || undefined,
      rentalItems: form.rentalItems || undefined,
      submit: isSubmitForReview,
    }

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setMessage(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setMessage(
        isSubmitForReview
          ? 'Offer submitted for partner review. Your licensed partner will be in touch shortly.'
          : 'Draft saved successfully.'
      )
      setStatus('success')
      onSubmit?.()
    } catch {
      setMessage('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  const isLoading = status === 'saving' || status === 'submitting'

  return (
    <div className="mx-auto max-w-2xl">
      {/* AI Pricing Guidance banner */}
      <div className="rounded-md bg-blue-50 border border-blue-200 p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>AI Pricing Guidance</strong> — AI-powered offer strategy with comparable sales
          analysis will be available in a future update. Your licensed partner will review and
          advise on pricing before submission.
        </p>
      </div>

      {/* MLS reference */}
      <p className="text-xs text-secondary-400 mb-6">
        Property: MLS#{mlsNumber}
      </p>

      <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-8">

        {/* Section: Purchase Terms */}
        <fieldset>
          <legend className="text-base font-semibold text-secondary-900 border-b border-secondary-200 pb-2 mb-4 w-full">
            Purchase Terms
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Purchase Price */}
            <div>
              <label
                htmlFor="purchasePrice"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Purchase Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                min="0"
                step="1000"
                value={form.purchasePrice}
                onChange={handleChange}
                placeholder="750000"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  clientErrors.purchasePrice
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-secondary-200'
                }`}
              />
              {clientErrors.purchasePrice && (
                <p className="mt-1 text-xs text-red-600">{clientErrors.purchasePrice}</p>
              )}
            </div>

            {/* Deposit */}
            <div>
              <label
                htmlFor="deposit"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Deposit ($)
              </label>
              <input
                id="deposit"
                name="deposit"
                type="number"
                min="0"
                step="1000"
                value={form.deposit}
                onChange={handleChange}
                placeholder="50000"
                className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </fieldset>

        {/* Section: Key Dates */}
        <fieldset>
          <legend className="text-base font-semibold text-secondary-900 border-b border-secondary-200 pb-2 mb-4 w-full">
            Key Dates
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Irrevocability Deadline */}
            <div>
              <label
                htmlFor="irrevocabilityDeadline"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Irrevocability Deadline
              </label>
              <input
                id="irrevocabilityDeadline"
                name="irrevocabilityDeadline"
                type="datetime-local"
                value={form.irrevocabilityDeadline}
                onChange={handleChange}
                className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Completion Date */}
            <div>
              <label
                htmlFor="completionDate"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Completion Date <span className="text-red-500">*</span>
              </label>
              <input
                id="completionDate"
                name="completionDate"
                type="datetime-local"
                value={form.completionDate}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  clientErrors.completionDate
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-secondary-200'
                }`}
              />
              {clientErrors.completionDate && (
                <p className="mt-1 text-xs text-red-600">{clientErrors.completionDate}</p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Section: Conditions */}
        <fieldset>
          <legend className="text-base font-semibold text-secondary-900 border-b border-secondary-200 pb-2 mb-4 w-full">
            Conditions
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Financing Condition Days */}
            <div>
              <label
                htmlFor="financingConditionDays"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Financing Condition (days)
              </label>
              <input
                id="financingConditionDays"
                name="financingConditionDays"
                type="number"
                min="0"
                max="365"
                value={form.financingConditionDays}
                onChange={handleChange}
                placeholder="10"
                className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-secondary-400">Leave blank for no financing condition</p>
            </div>

            {/* Inspection Condition Days */}
            <div>
              <label
                htmlFor="inspectionConditionDays"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Inspection Condition (days)
              </label>
              <input
                id="inspectionConditionDays"
                name="inspectionConditionDays"
                type="number"
                min="0"
                max="365"
                value={form.inspectionConditionDays}
                onChange={handleChange}
                placeholder="10"
                className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-secondary-400">Leave blank for no inspection condition</p>
            </div>
          </div>
        </fieldset>

        {/* Section: Chattels, Fixtures & Rental Items */}
        <fieldset>
          <legend className="text-base font-semibold text-secondary-900 border-b border-secondary-200 pb-2 mb-4 w-full">
            Chattels, Fixtures &amp; Rental Items
          </legend>
          <div className="space-y-4">
            {/* Chattels Included */}
            <div>
              <label
                htmlFor="chattelsIncluded"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Chattels Included
              </label>
              <textarea
                id="chattelsIncluded"
                name="chattelsIncluded"
                rows={3}
                value={form.chattelsIncluded}
                onChange={handleChange}
                placeholder="e.g., Fridge, Stove, Washer/Dryer, Dishwasher"
                className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>

            {/* Fixtures Excluded */}
            <div>
              <label
                htmlFor="fixturesExcluded"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Fixtures Excluded
              </label>
              <textarea
                id="fixturesExcluded"
                name="fixturesExcluded"
                rows={3}
                value={form.fixturesExcluded}
                onChange={handleChange}
                placeholder="e.g., Chandelier in dining room, Mounted TV in living room"
                className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>

            {/* Rental Items */}
            <div>
              <label
                htmlFor="rentalItems"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Rental Items
              </label>
              <textarea
                id="rentalItems"
                name="rentalItems"
                rows={3}
                value={form.rentalItems}
                onChange={handleChange}
                placeholder="e.g., Hot water heater (Enercare), Furnace (Direct Energy)"
                className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>
          </div>
        </fieldset>

        {/* Status message */}
        {message && (
          <div
            className={`rounded-md p-4 text-sm ${
              status === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}
          >
            {message}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isLoading}
            className="rounded-lg border border-secondary-300 bg-white px-6 py-2.5 text-sm font-medium text-secondary-700 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'saving' ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isLoading}
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  )
}
