import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// vi.hoisted ensures mockToDataStreamResponse is available inside the vi.mock factory
// (vi.mock is hoisted to the top of the file, so module-level consts aren't available)
const { mockToDataStreamResponse } = vi.hoisted(() => ({
  mockToDataStreamResponse: vi.fn().mockReturnValue(
    new Response('data: {"type":"text-delta","text":"Here is information..."}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  ),
}))

vi.mock('ai', () => ({
  streamText: vi.fn().mockResolvedValue({
    toTextStreamResponse: mockToDataStreamResponse,
  }),
}))

vi.mock('@/lib/ai/anthropic', () => ({
  anthropic: vi.fn(),
  HAIKU_MODEL: 'claude-3-5-haiku-20241022',
}))

vi.mock('@/lib/ai/prompts/chat', () => ({
  buildChatSystemPrompt: vi.fn().mockReturnValue('You are an AI assistant. Legal guardrail active.'),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_test_user' }),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { id: 'user-uuid-1', aiDataConsent: true },
          ]),
        }),
      }),
    }),
  },
}))

vi.mock('@/db/schema/users', () => ({
  users: {},
}))

vi.mock('@/lib/env', () => ({
  env: {},
}))

import { streamText } from 'ai'
import { db } from '@/db'

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Restore defaults after clearAllMocks
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-1', aiDataConsent: true }]),
        }),
      }),
    } as never)
    vi.mocked(streamText).mockResolvedValue({
      toTextStreamResponse: mockToDataStreamResponse,
    } as never)
    mockToDataStreamResponse.mockReturnValue(
      new Response('data: ok\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
    )
  })

  it('returns a streaming response for a non-legal question', async () => {
    const request = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is the financing condition deadline?' }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(streamText).toHaveBeenCalledOnce()
  })

  it('returns 403 when user has not given AI data consent', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'user-uuid-1', aiDataConsent: false }]),
        }),
      }),
    } as never)

    const request = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is a condition waiver?' }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toContain('consent')
  })

  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never)

    const request = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 400 when messages array is empty or missing', async () => {
    const request = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('passes the system prompt from buildChatSystemPrompt to streamText', async () => {
    const { buildChatSystemPrompt } = await import('@/lib/ai/prompts/chat')
    vi.mocked(buildChatSystemPrompt).mockReturnValueOnce('MOCKED SYSTEM PROMPT')

    const request = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Tell me about the offer process' }],
        context: { transactionStatus: 'OFFER_PENDING', mlsNumber: 'C12345' },
      }),
    })

    await POST(request)
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({ system: 'MOCKED SYSTEM PROMPT' })
    )
  })
})
