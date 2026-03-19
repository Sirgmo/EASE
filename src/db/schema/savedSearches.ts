// src/db/schema/savedSearches.ts
import { pgTable, uuid, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export interface SearchCriteria {
  city?: string
  area?: string
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  maxBedrooms?: number
  propertyType?: string  // 'residential' | 'condo'
  keywords?: string
}

export const savedSearches = pgTable('saved_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),               // e.g. "2BR in Annex under $700k"
  criteria: jsonb('criteria').$type<SearchCriteria>().notNull(),
  alertsEnabled: boolean('alerts_enabled').notNull().default(true),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type SavedSearch = typeof savedSearches.$inferSelect
export type NewSavedSearch = typeof savedSearches.$inferInsert
