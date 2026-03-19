// src/lib/deadline-checker.test.ts
// TDD: tests written BEFORE implementation
// Pure function tests — no DB mock needed. Functions accept arrays of condition objects.
import { describe, it, expect } from 'vitest'
import { findConditionsInWindow, getWindowField, type ConditionRow } from './deadline-checker'

// Helper to create condition objects with sensible defaults
function makeCondition(overrides: Partial<ConditionRow>): ConditionRow {
  return {
    id: 'cond-1',
    transactionId: 'tx-1',
    conditionType: 'financing',
    deadlineAt: new Date(),
    waivedAt: null,
    reminder48hSentAt: null,
    reminder24hSentAt: null,
    reminder4hSentAt: null,
    createdAt: new Date(),
    ...overrides,
  }
}

// Reference time used across tests
const NOW = new Date('2026-03-19T12:00:00.000Z')

// Helper: offset hours from NOW
function hoursFromNow(hours: number): Date {
  return new Date(NOW.getTime() + hours * 60 * 60 * 1000)
}


describe('findConditionsInWindow — 48h window', () => {
  it('returns condition when deadlineAt is exactly 48h from now and reminder48hSentAt is null', () => {
    const condition = makeCondition({ deadlineAt: hoursFromNow(48) })
    const result = findConditionsInWindow([condition], 48, NOW)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('cond-1')
  })

  it('returns empty when deadlineAt is 48h from now but reminder48hSentAt is already set', () => {
    const condition = makeCondition({
      deadlineAt: hoursFromNow(48),
      reminder48hSentAt: new Date(NOW.getTime() - 1000), // already sent
    })
    const result = findConditionsInWindow([condition], 48, NOW)
    expect(result).toHaveLength(0)
  })

  it('returns empty when condition is already waived (waivedAt not null)', () => {
    const condition = makeCondition({
      deadlineAt: hoursFromNow(48),
      waivedAt: new Date(NOW.getTime() - 60 * 60 * 1000), // waived 1h ago
    })
    const result = findConditionsInWindow([condition], 48, NOW)
    expect(result).toHaveLength(0)
  })

  it('returns condition when deadlineAt is within +30min of the 48h window (48h 29min out)', () => {
    // 48h + 29min = within the +30min tolerance
    const condition = makeCondition({ deadlineAt: new Date(NOW.getTime() + (48 * 60 + 29) * 60 * 1000) })
    const result = findConditionsInWindow([condition], 48, NOW)
    expect(result).toHaveLength(1)
  })

  it('returns condition when deadlineAt is within -30min of the 48h window (47h 31min out)', () => {
    // 48h - 29min = within the -30min tolerance
    const condition = makeCondition({ deadlineAt: new Date(NOW.getTime() + (48 * 60 - 29) * 60 * 1000) })
    const result = findConditionsInWindow([condition], 48, NOW)
    expect(result).toHaveLength(1)
  })

  it('returns empty when deadlineAt is 49h from now (outside 48h +/- 30min window)', () => {
    const condition = makeCondition({ deadlineAt: hoursFromNow(49) })
    const result = findConditionsInWindow([condition], 48, NOW)
    expect(result).toHaveLength(0)
  })
})

describe('findConditionsInWindow — 24h window', () => {
  it('returns condition when deadlineAt is exactly 24h from now and reminder24hSentAt is null', () => {
    const condition = makeCondition({ deadlineAt: hoursFromNow(24) })
    const result = findConditionsInWindow([condition], 24, NOW)
    expect(result).toHaveLength(1)
  })

  it('returns empty when reminder24hSentAt is already set', () => {
    const condition = makeCondition({
      deadlineAt: hoursFromNow(24),
      reminder24hSentAt: new Date(NOW.getTime() - 1000),
    })
    const result = findConditionsInWindow([condition], 24, NOW)
    expect(result).toHaveLength(0)
  })
})

describe('findConditionsInWindow — 4h window', () => {
  it('returns condition when deadlineAt is exactly 4h from now and reminder4hSentAt is null', () => {
    const condition = makeCondition({ deadlineAt: hoursFromNow(4) })
    const result = findConditionsInWindow([condition], 4, NOW)
    expect(result).toHaveLength(1)
  })

  it('returns empty when reminder4hSentAt is already set', () => {
    const condition = makeCondition({
      deadlineAt: hoursFromNow(4),
      reminder4hSentAt: new Date(NOW.getTime() - 1000),
    })
    const result = findConditionsInWindow([condition], 4, NOW)
    expect(result).toHaveLength(0)
  })
})

describe('getWindowField', () => {
  it('getWindowField(48) returns reminder48hSentAt', () => {
    expect(getWindowField(48)).toBe('reminder48hSentAt')
  })

  it('getWindowField(24) returns reminder24hSentAt', () => {
    expect(getWindowField(24)).toBe('reminder24hSentAt')
  })

  it('getWindowField(4) returns reminder4hSentAt', () => {
    expect(getWindowField(4)).toBe('reminder4hSentAt')
  })
})

describe('findConditionsInWindow — edge cases', () => {
  it('filters correctly when conditions array has mixed waived and active conditions', () => {
    const conditions = [
      makeCondition({ id: 'cond-1', deadlineAt: hoursFromNow(48) }),
      makeCondition({ id: 'cond-2', deadlineAt: hoursFromNow(48), waivedAt: new Date() }),
      makeCondition({ id: 'cond-3', deadlineAt: hoursFromNow(48), reminder48hSentAt: new Date() }),
    ]
    const result = findConditionsInWindow(conditions, 48, NOW)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('cond-1')
  })

  it('returns empty array when conditions array is empty', () => {
    const result = findConditionsInWindow([], 48, NOW)
    expect(result).toHaveLength(0)
  })
})
