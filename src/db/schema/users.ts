import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// users table — synced from Clerk via webhooks
// Clerk is the source of truth for authentication.
// This table stores app-level data for Ease business logic.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(), // Clerk user ID: user_xxxx
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  // PIPEDA — AI data consent must be timestamped and opt-in
  aiDataConsent: boolean('ai_data_consent').notNull().default(false),
  aiDataConsentAt: timestamp('ai_data_consent_at', { withTimezone: true }),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
