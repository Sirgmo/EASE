// src/lib/deadline-checker.ts
// Pure deadline window detection functions — no DB access, no side effects
// Caller pre-fetches conditions from DB and passes them in

export interface ConditionRow {
  id: string
  transactionId: string
  conditionType: string
  deadlineAt: Date
  waivedAt: Date | null
  reminder48hSentAt: Date | null
  reminder24hSentAt: Date | null
  reminder4hSentAt: Date | null
  createdAt: Date
}

export type DeadlineWindow = 48 | 24 | 4

export const DEADLINE_WINDOWS: DeadlineWindow[] = [48, 24, 4]

const WINDOW_FIELDS: Record<DeadlineWindow, keyof ConditionRow> = {
  48: 'reminder48hSentAt',
  24: 'reminder24hSentAt',
  4: 'reminder4hSentAt',
}

export function getWindowField(hours: DeadlineWindow): keyof ConditionRow {
  return WINDOW_FIELDS[hours]
}

/**
 * Filter conditions that are within +/- 30 minutes of the given deadline window
 * and have not yet had a reminder sent for that window.
 *
 * Pure function — no DB access. Caller passes pre-fetched conditions.
 *
 * @param conditions - Array of condition rows fetched from DB
 * @param windowHours - Reminder window: 48, 24, or 4 hours before deadline
 * @param now - Reference time (defaults to current time; injectable for testing)
 */
export function findConditionsInWindow(
  conditions: ConditionRow[],
  windowHours: DeadlineWindow,
  now: Date = new Date()
): ConditionRow[] {
  const field = WINDOW_FIELDS[windowHours]
  const windowMs = windowHours * 60 * 60 * 1000
  const toleranceMs = 30 * 60 * 1000 // +/- 30 minutes

  return conditions.filter((c) => {
    // Skip waived conditions — already-waived conditions must not trigger reminders
    if (c.waivedAt !== null) return false
    // Skip already-sent reminders — idempotency guard
    if (c[field] !== null) return false

    const timeUntilDeadline = c.deadlineAt.getTime() - now.getTime()
    return (
      timeUntilDeadline >= windowMs - toleranceMs &&
      timeUntilDeadline <= windowMs + toleranceMs
    )
  })
}
