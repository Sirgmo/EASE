import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const transactionInvitations = pgTable(
  'transaction_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id').notNull(),
    invitedEmail: text('invited_email').notNull(),
    role: text('role').notNull(),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    invitedByUserId: uuid('invited_by_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('invitations_token_idx').on(table.token),
  ]
)

export type TransactionInvitation = typeof transactionInvitations.$inferSelect
export type NewTransactionInvitation = typeof transactionInvitations.$inferInsert
