import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema/users'

export async function POST(_request: Request): Promise<Response> {
  await headers()
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Find internal user ID from Clerk ID
  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  if (userRows.length === 0) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Record consent with timestamp — PIPEDA requires timestamped consent record
  await db
    .update(users)
    .set({
      aiDataConsent: true,
      aiDataConsentAt: new Date(),
    })
    .where(eq(users.clerkId, userId))

  return Response.json({ consented: true, consentedAt: new Date().toISOString() })
}
