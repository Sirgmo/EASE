import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'

// Clerk webhook event types we handle
type ClerkWebhookEvent =
  | { type: 'user.created'; data: ClerkUserData }
  | { type: 'user.updated'; data: ClerkUserData }
  | { type: 'user.deleted'; data: { id: string } }

interface ClerkUserData {
  id: string
  email_addresses: Array<{ email_address: string; id: string }>
  primary_email_address_id: string
  first_name: string | null
  last_name: string | null
}

function getPrimaryEmail(data: ClerkUserData): string {
  const primary = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  )
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? ''
}

export async function POST(request: Request): Promise<Response> {
  // Step 1: Get Svix signature headers — Next.js 16 headers() is async
  const headersList = await headers()
  const svixId = headersList.get('svix-id')
  const svixTimestamp = headersList.get('svix-timestamp')
  const svixSignature = headersList.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  // Step 2: Verify signature using CLERK_WEBHOOK_SECRET
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const body = await request.text()
  const wh = new Webhook(webhookSecret)

  let event: ClerkWebhookEvent
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  // Step 3: Handle the event
  try {
    if (event.type === 'user.created') {
      await db.insert(users).values({
        clerkId: event.data.id,
        email: getPrimaryEmail(event.data),
        firstName: event.data.first_name,
        lastName: event.data.last_name,
      })
    } else if (event.type === 'user.updated') {
      await db
        .update(users)
        .set({
          email: getPrimaryEmail(event.data),
          firstName: event.data.first_name,
          lastName: event.data.last_name,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, event.data.id))
    } else if (event.type === 'user.deleted') {
      await db.delete(users).where(eq(users.clerkId, event.data.id))
    }
  } catch (err) {
    console.error('Database operation failed in Clerk webhook:', err)
    return new Response('Database error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
