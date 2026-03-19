// src/db/schema/searchAlertLog.ts
// Alert deduplication table — prevents duplicate emails for same listing + saved search
// Unique index on (savedSearchId, mlsNumber): INSERT ... ON CONFLICT DO NOTHING
import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { savedSearches } from './savedSearches'

export const searchAlertLog = pgTable('search_alert_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  savedSearchId: uuid('saved_search_id').notNull().references(() => savedSearches.id, { onDelete: 'cascade' }),
  mlsNumber: text('mls_number').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique: one alert per listing per saved search — prevents duplicate emails
  deduplicationKey: unique().on(table.savedSearchId, table.mlsNumber),
}))

export type SearchAlertLog = typeof searchAlertLog.$inferSelect
