// src/app/api/ai/chat/route.ts
// Streaming chat endpoint — uses streamText directly, NOT the async job queue
// Chat streams immediately; risk/offer/summary use the job queue instead
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { streamText } from 'ai'
import { z } from 'zod'
import { anthropic, HAIKU_MODEL } from '@/lib/ai/anthropic'
import { buildChatSystemPrompt } from '@/lib/ai/prompts/chat'
import { db } from '@/db'
import { users } from '@/db/schema/users'

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1),
    })
  ).min(1, 'At least one message is required'),
  context: z.object({
    transactionStatus: z.string().optional(),
    mlsNumber: z.string().optional(),
    coordinatorEmail: z.string().email().optional(),
  }).optional(),
})

export async function POST(request: Request): Promise<Response> {
  await headers()
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Gate on AI data consent (PIPEDA requirement)
  const userRows = await db
    .select({ id: users.id, aiDataConsent: users.aiDataConsent })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  const user = userRows[0]
  if (!user || !user.aiDataConsent) {
    return Response.json(
      { error: 'AI data processing consent required. Please accept the AI consent prompt first.' },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = chatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { messages, context } = parsed.data
  const systemPrompt = buildChatSystemPrompt(context ?? {})

  // streamText — AI SDK v6 returns toTextStreamResponse() for SSE streaming
  const result = await streamText({
    model: anthropic(HAIKU_MODEL),
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    maxOutputTokens: 1024,
    temperature: 0.3, // Lower temperature = more consistent guardrail behaviour
  })

  return result.toTextStreamResponse()
}
