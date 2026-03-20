import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { Resend } from 'resend'
import { db } from '@/db'
import { transactionInvitations } from '@/db/schema/invitations'
import { getTransactionRole } from '@/db/schema/transactionParties'
import { users } from '@/db/schema/users'
import { InvitationEmail } from '@/emails/InvitationEmail'

const createInvitationSchema = z.object({
  transactionId: z.string().uuid(),
  invitedEmail: z.string().email(),
  role: z.enum(['lawyer', 'inspector', 'coordinator']),
})

export async function POST(request: Request): Promise<Response> {
  await headers()
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createInvitationSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { transactionId, invitedEmail, role } = parsed.data

  const callerRole = await getTransactionRole(transactionId, userId)
  if (!callerRole) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userRows = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1)

  const caller = userRows[0]
  if (!caller) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

  const inserted = await db
    .insert(transactionInvitations)
    .values({
      transactionId,
      invitedEmail,
      role,
      token,
      expiresAt,
      invitedByUserId: caller.id,
    })
    .returning()

  const invitation = inserted[0]
  if (!invitation) {
    return Response.json({ error: 'Failed to create invitation' }, { status: 500 })
  }

  // Resend instantiated inside handler (not module-level) — cold-start safety
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviterName = [caller.firstName, caller.lastName].filter(Boolean).join(' ') || 'Someone'

  try {
    await resend.emails.send({
      from: 'invitations@ease.ca',
      to: invitedEmail,
      subject: `${inviterName} has invited you to a transaction on Ease`,
      react: InvitationEmail({ token, transactionId, role, inviterName, appUrl }),
    })
  } catch (err) {
    console.error('Failed to send invitation email:', err)
  }

  return Response.json({ invitation: { id: invitation.id, role, invitedEmail, expiresAt } }, { status: 201 })
}
