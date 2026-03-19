// src/lib/transactions/rbac.test.ts
// Tests for per-transaction RBAC helpers:
//   - getTransactionRole: role lookup for party, non-party, and inactive party
//   - fetchTransactionForRole: multi-join query returning role-scoped transaction data

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── DB mock — must be at module level (Vitest hoists vi.mock) ───────────────

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Build a fluent chain stub that resolves to `rows` at the terminal call.
// Supports: .select().from().where().limit() and .select().from().where().orderBy().limit()
function makeChain(rows: unknown[]) {
  const chain: Record<string, unknown> = {}
  const terminal = vi.fn().mockResolvedValue(rows)
  chain.from = vi.fn().mockReturnValue(chain)
  chain.where = vi.fn().mockReturnValue(chain)
  chain.orderBy = vi.fn().mockReturnValue(chain)
  chain.limit = terminal
  // fetchTransactionForRole calls without .limit() for conditions + parties:
  // treat the .where() return as a thenable for those cases
  const whereResult = {
    orderBy: vi.fn().mockReturnValue({ limit: terminal }),
    limit: terminal,
    then: (resolve: (v: unknown[]) => void) => resolve(rows),
  }
  chain.where = vi.fn().mockReturnValue(whereResult)
  return chain
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getTransactionRole', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns the correct role for an active party', async () => {
    const { db } = await import('@/db')
    const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> }

    // First call: users lookup → returns a user
    // Second call: transactionParties lookup → returns a party with role 'buyer'
    mockDb.select
      .mockReturnValueOnce(makeChain([{ id: 'user-uuid-1' }]))
      .mockReturnValueOnce(makeChain([{ role: 'buyer' }]))

    const { getTransactionRole } = await import('./rbac')
    const role = await getTransactionRole('tx-uuid-1', 'user_clerk_123')
    expect(role).toBe('buyer')
  })

  it('returns null for a user not found in the users table', async () => {
    const { db } = await import('@/db')
    const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> }

    // users lookup → empty (user not in DB)
    mockDb.select.mockReturnValueOnce(makeChain([]))

    const { getTransactionRole } = await import('./rbac')
    const role = await getTransactionRole('tx-uuid-1', 'user_unknown')
    expect(role).toBeNull()
  })

  it('returns null when the user is not a party to the transaction', async () => {
    const { db } = await import('@/db')
    const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> }

    // users lookup → returns a user
    // transactionParties lookup → empty (not a party)
    mockDb.select
      .mockReturnValueOnce(makeChain([{ id: 'user-uuid-2' }]))
      .mockReturnValueOnce(makeChain([]))

    const { getTransactionRole } = await import('./rbac')
    const role = await getTransactionRole('tx-uuid-1', 'user_clerk_456')
    expect(role).toBeNull()
  })

  it('returns null for an inactive party (isActive = false excluded by query)', async () => {
    const { db } = await import('@/db')
    const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> }

    // users lookup → returns a user
    // transactionParties lookup → empty (isActive=false filtered out by where clause)
    mockDb.select
      .mockReturnValueOnce(makeChain([{ id: 'user-uuid-3' }]))
      .mockReturnValueOnce(makeChain([]))

    const { getTransactionRole } = await import('./rbac')
    const role = await getTransactionRole('tx-uuid-2', 'user_clerk_789')
    expect(role).toBeNull()
  })
})

describe('fetchTransactionForRole', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns transaction with events, conditions, and parties for buyer role', async () => {
    const { db } = await import('@/db')
    const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> }

    const mockTx = {
      id: 'tx-uuid-1',
      mlsNumber: 'C12345678',
      status: 'OFFER_PENDING',
      serviceTier: 'ai_diy',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const mockEvents = [
      { fromStatus: null, toStatus: 'DRAFT', note: null, createdAt: new Date() },
      { fromStatus: 'DRAFT', toStatus: 'OFFER_PENDING', note: 'Tier selected', createdAt: new Date() },
    ]
    const mockConditions = [
      { conditionType: 'financing', deadlineAt: new Date(), waivedAt: null },
    ]
    const mockParties = [
      { role: 'buyer', userId: 'user-uuid-1' },
    ]

    // Four calls: transactions, transactionEvents, transactionConditions, transactionParties
    mockDb.select
      .mockReturnValueOnce(makeChain([mockTx]))        // transactions
      .mockReturnValueOnce(makeChain(mockEvents))       // transactionEvents
      .mockReturnValueOnce(makeChain(mockConditions))   // transactionConditions
      .mockReturnValueOnce(makeChain(mockParties))      // transactionParties

    const { fetchTransactionForRole } = await import('./rbac')
    const result = await fetchTransactionForRole('tx-uuid-1', 'buyer')

    expect(result).not.toBeNull()
    expect(result!.transaction.mlsNumber).toBe('C12345678')
    expect(result!.events).toHaveLength(2)
    expect(result!.conditions).toHaveLength(1)
    expect(result!.parties).toHaveLength(1)
    expect(result!.viewerRole).toBe('buyer')
  })

  it('returns null when the transaction does not exist', async () => {
    const { db } = await import('@/db')
    const mockDb = db as unknown as { select: ReturnType<typeof vi.fn> }

    // transactions lookup → empty
    mockDb.select.mockReturnValueOnce(makeChain([]))

    const { fetchTransactionForRole } = await import('./rbac')
    const result = await fetchTransactionForRole('nonexistent-uuid', 'lawyer')
    expect(result).toBeNull()
  })
})
