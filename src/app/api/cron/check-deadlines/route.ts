// src/app/api/cron/check-deadlines/route.ts
// Vercel cron endpoint — runs every 30 minutes (requires Vercel Pro)
// Security: Vercel sends CRON_SECRET as Authorization: Bearer {secret}
// Idempotency: reminder*SentAt columns prevent duplicate sends per window per condition
//
// IMPORTANT: CRON_SECRET uses process.env directly — avoids Zod schema parse blocking cold-start
// IMPORTANT: Resend is instantiated inside handler (not module-level) to prevent cold-start failures
import { db } from '@/db'
import { isNull, eq } from 'drizzle-orm'
import { transactionConditions, transactions } from '@/db/schema/transactions'
import { users } from '@/db/schema/users'
import { findConditionsInWindow, DEADLINE_WINDOWS, getWindowField } from '@/lib/deadline-checker'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import DeadlineReminder from '@/emails/DeadlineReminder'

export async function GET(request: Request) {
  // Security gate — Vercel cron sends CRON_SECRET as Authorization: Bearer {secret}
  // Uses process.env directly (not env.ts) to avoid Zod schema parse blocking cold-start
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Instantiate Resend inside handler — prevents cold-start failures when RESEND_API_KEY absent
  const resend = new Resend(process.env.RESEND_API_KEY)
  const now = new Date()

  // Fetch all unwaived conditions from DB
  // Pure function (findConditionsInWindow) handles window filtering in memory
  const allConditions = await db
    .select()
    .from(transactionConditions)
    .where(isNull(transactionConditions.waivedAt))

  let remindersSent = 0

  for (const windowHours of DEADLINE_WINDOWS) {
    const conditionsInWindow = findConditionsInWindow(allConditions, windowHours, now)

    for (const condition of conditionsInWindow) {
      // Look up transaction for mlsNumber
      const [tx] = await db
        .select({ buyerId: transactions.buyerId, mlsNumber: transactions.mlsNumber })
        .from(transactions)
        .where(eq(transactions.id, condition.transactionId))
        .limit(1)

      if (!tx) continue

      // Look up buyer email
      const [buyer] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, tx.buyerId))
        .limit(1)

      if (!buyer?.email) continue

      // Render React Email template to HTML
      const emailHtml = await render(
        DeadlineReminder({
          conditionType: condition.conditionType,
          deadlineAt: condition.deadlineAt.toISOString(),
          hoursRemaining: windowHours,
          transactionId: condition.transactionId,
          mlsNumber: tx.mlsNumber,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ease.ca',
        })
      )

      // Send reminder email via Resend
      await resend.emails.send({
        from: 'Ease <alerts@ease.ca>',
        to: buyer.email,
        subject: `${condition.conditionType.charAt(0).toUpperCase() + condition.conditionType.slice(1)} deadline in ${windowHours} hours`,
        html: emailHtml,
      })

      // Mark reminder as sent — idempotency guard prevents duplicate sends
      const field = getWindowField(windowHours)
      await db
        .update(transactionConditions)
        .set({ [field]: now })
        .where(eq(transactionConditions.id, condition.id))

      remindersSent++
    }
  }

  return Response.json({ ok: true, remindersSent })
}
