import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

// Import only the pure function — no SDK calls needed for this test
import { verifyDocuSignHmac } from './docusign'

function makeHmac(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(Buffer.from(body)).digest('base64')
}

describe('verifyDocuSignHmac', () => {
  const secret = 'test-webhook-secret-abc123'
  const body = JSON.stringify({ event: 'envelope-completed', data: { envelopeId: 'env-001' } })

  it('returns true for a valid HMAC signature', () => {
    const signature = makeHmac(body, secret)
    expect(verifyDocuSignHmac(Buffer.from(body), signature, secret)).toBe(true)
  })

  it('returns false for an incorrect signature', () => {
    const wrongSignature = makeHmac(body, 'wrong-secret')
    expect(verifyDocuSignHmac(Buffer.from(body), wrongSignature, secret)).toBe(false)
  })

  it('returns false for a tampered body', () => {
    const signature = makeHmac(body, secret)
    const tamperedBody = body.replace('envelope-completed', 'envelope-voided')
    expect(verifyDocuSignHmac(Buffer.from(tamperedBody), signature, secret)).toBe(false)
  })

  it('returns false for an empty signature string', () => {
    expect(verifyDocuSignHmac(Buffer.from(body), '', secret)).toBe(false)
  })
})
