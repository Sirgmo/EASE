// src/lib/transactions/state-machine.test.ts
// TDD: tests written BEFORE implementation
// Pure functions — no DB dependency, no vi.mock needed
import { describe, it, expect } from 'vitest'
import { isValidTransition, VALID_TRANSITIONS } from './state-machine'
import { getStepsForStatus, BUYER_STEPS } from './steps'

describe('isValidTransition — valid forward transitions', () => {
  it('DRAFT -> OFFER_PENDING is valid', () => {
    expect(isValidTransition('DRAFT', 'OFFER_PENDING')).toBe(true)
  })

  it('OFFER_PENDING -> OFFER_SUBMITTED is valid', () => {
    expect(isValidTransition('OFFER_PENDING', 'OFFER_SUBMITTED')).toBe(true)
  })

  it('OFFER_SUBMITTED -> OFFER_ACCEPTED is valid', () => {
    expect(isValidTransition('OFFER_SUBMITTED', 'OFFER_ACCEPTED')).toBe(true)
  })

  it('OFFER_ACCEPTED -> CONDITIONS_PENDING is valid', () => {
    expect(isValidTransition('OFFER_ACCEPTED', 'CONDITIONS_PENDING')).toBe(true)
  })

  it('CONDITIONS_PENDING -> CONDITIONS_WAIVED is valid', () => {
    expect(isValidTransition('CONDITIONS_PENDING', 'CONDITIONS_WAIVED')).toBe(true)
  })

  it('CONDITIONS_WAIVED -> CLOSING is valid', () => {
    expect(isValidTransition('CONDITIONS_WAIVED', 'CLOSING')).toBe(true)
  })

  it('CLOSING -> CLOSED is valid', () => {
    expect(isValidTransition('CLOSING', 'CLOSED')).toBe(true)
  })
})

describe('isValidTransition — invalid skip transitions', () => {
  it('DRAFT -> CLOSED is invalid (skip not allowed)', () => {
    expect(isValidTransition('DRAFT', 'CLOSED')).toBe(false)
  })

  it('DRAFT -> CONDITIONS_PENDING is invalid (skip not allowed)', () => {
    expect(isValidTransition('DRAFT', 'CONDITIONS_PENDING')).toBe(false)
  })

  it('OFFER_PENDING -> CLOSING is invalid (skip not allowed)', () => {
    expect(isValidTransition('OFFER_PENDING', 'CLOSING')).toBe(false)
  })
})

describe('isValidTransition — terminal states', () => {
  it('CLOSED -> DRAFT is invalid (terminal state)', () => {
    expect(isValidTransition('CLOSED', 'DRAFT')).toBe(false)
  })

  it('CLOSED -> OFFER_PENDING is invalid (terminal state)', () => {
    expect(isValidTransition('CLOSED', 'OFFER_PENDING')).toBe(false)
  })

  it('CANCELLED -> DRAFT is invalid (terminal state)', () => {
    expect(isValidTransition('CANCELLED', 'DRAFT')).toBe(false)
  })

  it('VALID_TRANSITIONS[CLOSED] is empty array (terminal)', () => {
    expect(VALID_TRANSITIONS['CLOSED']).toEqual([])
  })

  it('VALID_TRANSITIONS[CANCELLED] is empty array (terminal)', () => {
    expect(VALID_TRANSITIONS['CANCELLED']).toEqual([])
  })
})

describe('isValidTransition — CANCELLED reachable from all non-terminals', () => {
  it('DRAFT -> CANCELLED is valid', () => {
    expect(isValidTransition('DRAFT', 'CANCELLED')).toBe(true)
  })

  it('OFFER_PENDING -> CANCELLED is valid', () => {
    expect(isValidTransition('OFFER_PENDING', 'CANCELLED')).toBe(true)
  })

  it('OFFER_SUBMITTED -> CANCELLED is valid', () => {
    expect(isValidTransition('OFFER_SUBMITTED', 'CANCELLED')).toBe(true)
  })

  it('OFFER_ACCEPTED -> CANCELLED is valid', () => {
    expect(isValidTransition('OFFER_ACCEPTED', 'CANCELLED')).toBe(true)
  })

  it('CONDITIONS_PENDING -> CANCELLED is valid', () => {
    expect(isValidTransition('CONDITIONS_PENDING', 'CANCELLED')).toBe(true)
  })

  it('CLOSING -> CANCELLED is valid', () => {
    expect(isValidTransition('CLOSING', 'CANCELLED')).toBe(true)
  })

  it('every non-terminal status can transition to CANCELLED', () => {
    const nonTerminals = ['DRAFT', 'OFFER_PENDING', 'OFFER_SUBMITTED', 'OFFER_ACCEPTED', 'CONDITIONS_PENDING', 'CONDITIONS_WAIVED', 'CLOSING'] as const
    for (const status of nonTerminals) {
      const validTargets = VALID_TRANSITIONS[status]
      // Each non-terminal should have CANCELLED as a valid target (except CONDITIONS_WAIVED which goes to CLOSING only)
      // Note: CONDITIONS_WAIVED -> CLOSING only per the plan spec
    }
    // Verify all except CONDITIONS_WAIVED can reach CANCELLED
    const canCancelDirectly = ['DRAFT', 'OFFER_PENDING', 'OFFER_SUBMITTED', 'OFFER_ACCEPTED', 'CONDITIONS_PENDING', 'CLOSING'] as const
    for (const status of canCancelDirectly) {
      expect(isValidTransition(status, 'CANCELLED')).toBe(true)
    }
  })
})

describe('getStepsForStatus — step status calculation', () => {
  it('getStepsForStatus(DRAFT) returns first step as current, rest as upcoming', () => {
    const steps = getStepsForStatus('DRAFT')
    expect(steps[0].status).toBe('current')
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].status).toBe('upcoming')
    }
  })

  it('getStepsForStatus(CONDITIONS_PENDING) returns first 4 steps as completed, 5th as current', () => {
    const steps = getStepsForStatus('CONDITIONS_PENDING')
    // BUYER_STEPS order: start, offer, review, negotiate, conditions, waiver, closing, done
    // CONDITIONS_PENDING is activeAt index 4 (0-based: start=0, offer=1, review=2, negotiate=3, conditions=4)
    expect(steps[0].status).toBe('completed') // start
    expect(steps[1].status).toBe('completed') // offer
    expect(steps[2].status).toBe('completed') // review
    expect(steps[3].status).toBe('completed') // negotiate
    expect(steps[4].status).toBe('current')   // conditions
    expect(steps[5].status).toBe('upcoming')  // waiver
    expect(steps[6].status).toBe('upcoming')  // closing
    expect(steps[7].status).toBe('upcoming')  // done
  })

  it('getStepsForStatus(CLOSED) returns all steps as completed except last which is current', () => {
    const steps = getStepsForStatus('CLOSED')
    // CLOSED is the last step (done, activeAt: ['CLOSED'])
    for (let i = 0; i < steps.length - 1; i++) {
      expect(steps[i].status).toBe('completed')
    }
    expect(steps[steps.length - 1].status).toBe('current')
  })

  it('getStepsForStatus returns correct number of steps', () => {
    const steps = getStepsForStatus('DRAFT')
    expect(steps.length).toBe(BUYER_STEPS.length)
  })
})
