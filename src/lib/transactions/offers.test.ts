// src/lib/transactions/offers.test.ts
// TDD: tests written BEFORE implementation
// Do NOT import from '@/lib/env' — pure validation, no DB or env needed
import { describe, it, expect } from 'vitest'
import { validateOfferFields } from './offers-validation'

// Valid complete offer data for use in positive tests
const validOffer = {
  transactionId: '550e8400-e29b-41d4-a716-446655440000',
  purchasePrice: 75000000,     // $750,000 in cents
  deposit: 5000000,            // $50,000 in cents (optional)
  irrevocabilityDeadline: '2026-04-15T17:00:00.000Z',  // optional
  completionDate: '2026-06-30T17:00:00.000Z',           // required
  financingConditionDays: 10,
  inspectionConditionDays: 10,
  chattelsIncluded: 'Fridge, Stove, Washer/Dryer',
  fixturesExcluded: 'Chandelier in dining room',
  rentalItems: 'Hot water heater (Enercare)',
}

describe('validateOfferFields — required fields', () => {
  it('returns errors when purchasePrice is missing', () => {
    const result = validateOfferFields({ ...validOffer, purchasePrice: undefined as unknown as number })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('returns errors when purchasePrice is zero', () => {
    const result = validateOfferFields({ ...validOffer, purchasePrice: 0 })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('returns errors when purchasePrice is negative', () => {
    const result = validateOfferFields({ ...validOffer, purchasePrice: -100 })
    expect(result.success).toBe(false)
  })

  it('returns errors when completionDate is missing', () => {
    const result = validateOfferFields({ ...validOffer, completionDate: undefined as unknown as string })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})

describe('validateOfferFields — optional field constraints', () => {
  it('returns errors when deposit is negative', () => {
    const result = validateOfferFields({ ...validOffer, deposit: -1 })
    expect(result.success).toBe(false)
  })

  it('returns errors when financingConditionDays exceeds 365', () => {
    const result = validateOfferFields({ ...validOffer, financingConditionDays: 366 })
    expect(result.success).toBe(false)
  })

  it('returns errors when inspectionConditionDays exceeds 365', () => {
    const result = validateOfferFields({ ...validOffer, inspectionConditionDays: 400 })
    expect(result.success).toBe(false)
  })

  it('accepts zero financingConditionDays (no financing condition)', () => {
    const result = validateOfferFields({ ...validOffer, financingConditionDays: 0 })
    expect(result.success).toBe(true)
  })

  it('accepts zero deposit (no deposit entered yet)', () => {
    const result = validateOfferFields({ ...validOffer, deposit: 0 })
    expect(result.success).toBe(true)
  })
})

describe('validateOfferFields — valid complete offer', () => {
  it('accepts a fully populated valid offer', () => {
    const result = validateOfferFields(validOffer)
    expect(result.success).toBe(true)
    expect(result.errors).toBeUndefined()
  })

  it('accepts an offer with only required fields', () => {
    const result = validateOfferFields({
      transactionId: '550e8400-e29b-41d4-a716-446655440000',
      purchasePrice: 50000000,     // $500,000 in cents
      completionDate: '2026-06-30T17:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })
})
