// src/lib/closing-costs.test.ts
// TDD: tests written BEFORE implementation
import { describe, it, expect } from 'vitest'
import { estimateClosingCosts } from './closing-costs'

describe('estimateClosingCosts', () => {
  it('returns all required line items', () => {
    const result = estimateClosingCosts(800_000)
    expect(result).toHaveProperty('legalFeesLow')
    expect(result).toHaveProperty('legalFeesHigh')
    expect(result).toHaveProperty('titleInsuranceLow')
    expect(result).toHaveProperty('titleInsuranceHigh')
    expect(result).toHaveProperty('inspectionLow')
    expect(result).toHaveProperty('inspectionHigh')
    expect(result).toHaveProperty('totalLow')
    expect(result).toHaveProperty('totalHigh')
  })

  it('legal fees: $1,500–$2,500 range (flat rate, not purchase-price dependent)', () => {
    const result = estimateClosingCosts(500_000)
    expect(result.legalFeesLow).toBe(1_500)
    expect(result.legalFeesHigh).toBe(2_500)
  })

  it('title insurance: $200–$500 (flat estimate for v1)', () => {
    const result = estimateClosingCosts(500_000)
    expect(result.titleInsuranceLow).toBe(200)
    expect(result.titleInsuranceHigh).toBe(500)
  })

  it('inspection: $300–$600', () => {
    const result = estimateClosingCosts(500_000)
    expect(result.inspectionLow).toBe(300)
    expect(result.inspectionHigh).toBe(600)
  })

  it('totalLow = sum of all low estimates', () => {
    const result = estimateClosingCosts(500_000)
    expect(result.totalLow).toBe(result.legalFeesLow + result.titleInsuranceLow + result.inspectionLow)
  })

  it('totalHigh = sum of all high estimates', () => {
    const result = estimateClosingCosts(500_000)
    expect(result.totalHigh).toBe(result.legalFeesHigh + result.titleInsuranceHigh + result.inspectionHigh)
  })

  it('all values are positive numbers', () => {
    const result = estimateClosingCosts(1_500_000)
    Object.values(result).forEach((v) => {
      expect(typeof v).toBe('number')
      expect(v).toBeGreaterThan(0)
    })
  })
})
