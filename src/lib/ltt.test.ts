// src/lib/ltt.test.ts
// TDD: tests written BEFORE implementation
// Do NOT import from '@/lib/env' — ltt.ts must accept brackets as parameters for testability
import { describe, it, expect } from 'vitest'
import { calculateLTT } from './ltt'

// Ontario standard brackets (stable since 2017)
const ONTARIO_BRACKETS = [
  { thresholdFrom: 0, thresholdTo: 55_000, rate: 0.005 },
  { thresholdFrom: 55_000, thresholdTo: 250_000, rate: 0.010 },
  { thresholdFrom: 250_000, thresholdTo: 400_000, rate: 0.015 },
  { thresholdFrom: 400_000, thresholdTo: 2_000_000, rate: 0.020 },
  { thresholdFrom: 2_000_000, thresholdTo: null, rate: 0.025 }, // Residential only
]

// Ontario brackets without the 2.5% tier (condos/commercial)
const ONTARIO_CONDO_BRACKETS = ONTARIO_BRACKETS.slice(0, 4).concat([
  { thresholdFrom: 2_000_000, thresholdTo: null, rate: 0.020 }, // Condos stay at 2%
])

// Toronto MLTT including luxury brackets (April 1, 2026)
const TORONTO_BRACKETS = [
  { thresholdFrom: 0, thresholdTo: 55_000, rate: 0.005 },
  { thresholdFrom: 55_000, thresholdTo: 250_000, rate: 0.010 },
  { thresholdFrom: 250_000, thresholdTo: 400_000, rate: 0.015 },
  { thresholdFrom: 400_000, thresholdTo: 2_000_000, rate: 0.020 },
  { thresholdFrom: 2_000_000, thresholdTo: 3_000_000, rate: 0.025 },
  { thresholdFrom: 3_000_000, thresholdTo: 4_000_000, rate: 0.044 },   // April 1, 2026
  { thresholdFrom: 4_000_000, thresholdTo: 5_000_000, rate: 0.0545 },  // April 1, 2026
  { thresholdFrom: 5_000_000, thresholdTo: 10_000_000, rate: 0.065 },  // April 1, 2026
  { thresholdFrom: 10_000_000, thresholdTo: 20_000_000, rate: 0.0755 }, // April 1, 2026
  { thresholdFrom: 20_000_000, thresholdTo: null, rate: 0.086 },        // April 1, 2026
]

describe('calculateLTT — Ontario provincial (no Toronto)', () => {
  it('$55,000 home: first bracket only = $275', () => {
    const result = calculateLTT(55_000, ONTARIO_BRACKETS, null, false)
    expect(result.provincialLTT).toBe(275)
    expect(result.municipalLTT).toBe(0)
    expect(result.totalLTT).toBe(275)
    expect(result.netLTT).toBe(275)
  })

  it('$400,000 home: three brackets cumulative = $4,475', () => {
    const result = calculateLTT(400_000, ONTARIO_BRACKETS, null, false)
    expect(result.provincialLTT).toBe(4_475)
    expect(result.municipalLTT).toBe(0)
  })

  it('$800,000 home: Ontario LTT = $4,475 + $400,000 * 2% = $12,475', () => {
    const result = calculateLTT(800_000, ONTARIO_BRACKETS, null, false)
    expect(result.provincialLTT).toBe(12_475)
  })

  it('$2,500,000 condo: condo brackets cap at 2% — no 2.5% bracket', () => {
    const result = calculateLTT(2_500_000, ONTARIO_CONDO_BRACKETS, null, false)
    // At $2M: 36,475. Above $2M for condo: 500,000 * 2% = 10,000
    expect(result.provincialLTT).toBe(46_475)
  })

  it('$2,500,000 house: 2.5% bracket applies above $2M', () => {
    const result = calculateLTT(2_500_000, ONTARIO_BRACKETS, null, false)
    // At $2M: 36,475. Above $2M for house: 500,000 * 2.5% = 12,500
    expect(result.provincialLTT).toBe(48_975)
  })
})

describe('calculateLTT — Toronto double LTT', () => {
  it('$500,000 Toronto, no rebate: provincial + municipal both = $6,475 each', () => {
    const result = calculateLTT(500_000, ONTARIO_BRACKETS, TORONTO_BRACKETS, false)
    // $500k Ontario: 275 + 1950 + 2250 + 2000 = 6475
    expect(result.provincialLTT).toBe(6_475)
    expect(result.municipalLTT).toBe(6_475)
    expect(result.totalLTT).toBe(12_950)
    expect(result.netLTT).toBe(12_950)
  })

  it('$3,500,000 Toronto: luxury bracket (4.40%) applied above $3M', () => {
    const result = calculateLTT(3_500_000, ONTARIO_BRACKETS, TORONTO_BRACKETS, false)
    // Toronto at $3M: 275+1950+2250+32000+20000 = 56475
    // Luxury: 500000 * 0.044 = 22000
    expect(result.municipalLTT).toBe(78_475)
  })
})

describe('calculateLTT — first-time buyer rebates', () => {
  it('$500,000 Toronto first-time buyer: Ontario rebate $4,000, Toronto rebate $4,475', () => {
    const result = calculateLTT(500_000, ONTARIO_BRACKETS, TORONTO_BRACKETS, true)
    expect(result.provincialRebate).toBe(4_000)    // Capped at $4,000
    expect(result.municipalRebate).toBe(4_475)     // Capped at $4,475 (6475 > 4475, so capped)
    expect(result.netLTT).toBe(12_950 - 4_000 - 4_475) // = 4475
  })

  it('$200,000 Ontario first-time buyer: full provincial rebate (LTT < $4,000 cap)', () => {
    const result = calculateLTT(200_000, ONTARIO_BRACKETS, null, true)
    // $200k Ontario LTT: 275 + (145000 * 0.01) = 1725
    expect(result.provincialLTT).toBe(1_725)
    expect(result.provincialRebate).toBe(1_725) // Full rebate — under the $4k cap
    expect(result.netLTT).toBe(0)
  })

  it('$400,000 Toronto first-time buyer: full Toronto municipal rebate ($4,475 covers all)', () => {
    const result = calculateLTT(400_000, ONTARIO_BRACKETS, TORONTO_BRACKETS, true)
    // Toronto LTT at $400k: 275+1950+2250 = 4475
    // rebate = min(4475, 4475) = 4475 — full rebate
    expect(result.municipalLTT).toBe(4_475)
    expect(result.municipalRebate).toBe(4_475)
  })
})
