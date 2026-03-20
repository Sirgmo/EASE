import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { transactionInvitations } from '@/db/schema/invitations'
import { transactionParties } from '@/db/schema/transactionParties'
import { users } from '@/db/schema/users'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
): Promise<Response> {
  await headers()
  const { token } = await params
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const invRows = await db
    .select()
    .from(transactionInvitations)
    .where(eq(transactionInvitations.token, token))
    .limit(1)

  const invitation = invRows[0]

  if (!invitation) {
    return Response.json({ error: 'Invitation not found' }, { status: 404 })
  }

  if (invitation.usedAt !== null) {
    return Response.json({ error: 'This invitation has already been used' }, { status: 409 })
  }

  if (invitation.expiresAt < new Date()) {
    return Response.json({ error: 'This invitation has expired' }, { status: 410 })
  }

  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  const user = userRows[0]
  if (!user) {
    return Response.json({ error: 'User account not found' }, { status: 404 })
  }

  try {
    await db.insert(transactionParties).values({
      transactionId: invitation.transactionId,
      userId: user.id,
      role: invitation.role as 'lawyer' | 'inspector' | 'coordinator',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('23505') || message.includes('unique constraint')) {
      // Already a party — idempotent for same user
    } else {
      throw err
    }
  }

  await db
    .update(transactionInvitations)
    .set({ usedAt: new Date() })
    .where(eq(transactionInvitations.token, token))

  return Response.json({
    success: true,
    transactionId: invitation.transactionId,
    role: invitation.role,
  })
}
