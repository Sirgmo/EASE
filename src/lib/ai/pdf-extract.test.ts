import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/r2', () => ({
  r2: { send: vi.fn() },
}))

vi.mock('@/lib/env', () => ({
  env: {
    R2_BUCKET_NAME: 'ease-documents',
  },
}))

// Mock GetObjectCommand as a plain constructible spy — the returned command
// object doesn't matter since r2.send is fully mocked at the module level.
vi.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: vi.fn(),
}))

// pdf-parse is a CJS module imported as a default import in the implementation.
// The mock factory must return { default: fn } so Vitest resolves the default export correctly.
const { mockPdfParse } = vi.hoisted(() => ({
  mockPdfParse: vi.fn(),
}))
vi.mock('pdf-parse', () => ({ default: mockPdfParse }))

import { extractPdfTextFromR2 } from './pdf-extract'
import { r2 } from '@/lib/r2'

describe('extractPdfTextFromR2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns extracted text from a valid PDF in R2', async () => {
    const fakeBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // %PDF magic bytes
    vi.mocked(r2.send).mockResolvedValue({
      Body: {
        transformToByteArray: vi.fn().mockResolvedValue(fakeBytes),
      },
    } as never)
    mockPdfParse.mockResolvedValue({ text: 'Agreement of Purchase and Sale...' })

    const text = await extractPdfTextFromR2('transactions/tx-1/docs/agreement.pdf')
    expect(text).toBe('Agreement of Purchase and Sale...')
  })

  it('throws when R2 object Body is undefined', async () => {
    vi.mocked(r2.send).mockResolvedValue({ Body: undefined } as never)
    await expect(extractPdfTextFromR2('missing/key.pdf')).rejects.toThrow('Document not found in R2')
  })
})
