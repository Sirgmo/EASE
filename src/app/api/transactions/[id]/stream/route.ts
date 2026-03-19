// src/app/api/transactions/[id]/stream/route.ts
// SSE endpoint — streams real-time transaction updates to the dashboard.
//
// Connection lifecycle:
//   1. Auth check — 401 if not signed in
//   2. RBAC check — 403 if not an active party on this transaction
//   3. Send initial state immediately (type: 'init')
//   4. Poll every 3 seconds (type: 'update')
//   5. maxDuration = 55s — client EventSource auto-reconnects after timeout
//
// X-Accel-Buffering: no — disables nginx proxy buffering so SSE events reach
// the browser immediately rather than being held until the buffer fills.

import { auth } from '@clerk/nextjs/server'
import { getTransactionRole, fetchTransactionForRole } from '@/lib/transactions/rbac'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 55 // seconds — client reconnects after timeout

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth gate — must be signed in
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Await dynamic route params (Next.js 16 — params is a Promise)
  const { id } = await params

  // RBAC gate — must be an active party on this transaction
  const role = await getTransactionRole(id, userId)
  if (!role) {
    return new Response('Forbidden', { status: 403 })
  }

  // Build SSE ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Helper: encode and enqueue an SSE message
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Send initial transaction state immediately so the dashboard renders without delay
      const initial = await fetchTransactionForRole(id, role)
      send({ type: 'init', ...initial })

      // Poll for changes every 3 seconds.
      // The 55-second maxDuration means ~18 polls per connection before EventSource reconnects.
      const interval = setInterval(async () => {
        try {
          const updated = await fetchTransactionForRole(id, role)
          send({ type: 'update', ...updated })
        } catch {
          // DB error — close the stream; EventSource will reconnect
          clearInterval(interval)
          controller.close()
        }
      }, 3000)

      // Clean up when the client disconnects (browser tab closed, navigation away, etc.)
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disable nginx/Vercel proxy buffering — events must reach browser immediately
      'X-Accel-Buffering': 'no',
    },
  })
}
