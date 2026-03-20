import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

// vi.hoisted runs before vi.mock factories — allows referencing the constant inside mocks
const { WEBHOOK_SECRET } = vi.hoisted(() => ({
  WEBHOOK_SECRET: 'test-webhook-secret-abc123',
}))

// Module-level mocks — must be at top level for Vitest hoisting
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 'doc-001',
            transactionId: 'tx-001',
            docusignEnvelopeId: 'env-001',
          }]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}))

vi.mock('@/db/schema/documents', () => ({
  documents: { docusignEnvelopeId: 'docusign_envelope_id', signedAt: 'signed_at', id: 'id' },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/env', () => ({
  env: { DOCUSIGN_WEBHOOK_SECRET: WEBHOOK_SECRET },
}))

import { POST } from './route'

function makeSignature(body: string): string {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(Buffer.from(body)).digest('base64')
}

describe('POST /api/webhooks/docusign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when HMAC signature is invalid', async () => {
    const body = JSON.stringify({ event: 'envelope-completed', data: { envelopeId: 'env-001' } })
    const request = new Request('http://localhost/api/webhooks/docusign', {
      method: 'POST',
      headers: { 'x-docusign-signature-1': 'invalid-signature' },
      body,
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 200 and ignores unknown events with valid HMAC', async () => {
    const body = JSON.stringify({ event: 'envelope-sent', data: { envelopeId: 'env-001' } })
    const request = new Request('http://localhost/api/webhooks/docusign', {
      method: 'POST',
      headers: { 'x-docusign-signature-1': makeSignature(body) },
      body,
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.received).toBe(true)
  })

  it('returns 200 and updates signedAt on envelope-completed event', async () => {
    const body = JSON.stringify({
      event: 'envelope-completed',
      data: { envelopeId: 'env-001', accountId: 'acct-001' },
    })
    const request = new Request('http://localhost/api/webhooks/docusign', {
      method: 'POST',
      headers: { 'x-docusign-signature-1': makeSignature(body) },
      body,
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const { db } = await import('@/db')
    expect(vi.mocked(db.update)).toHaveBeenCalled()
  })

  it('returns 401 when x-docusign-signature-1 header is missing', async () => {
    const body = JSON.stringify({ event: 'envelope-completed', data: { envelopeId: 'env-001' } })
    const request = new Request('http://localhost/api/webhooks/docusign', {
      method: 'POST',
      body,
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
