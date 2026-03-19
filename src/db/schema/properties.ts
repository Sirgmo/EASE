import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import type { RepliersListing } from '@/types/repliers'

// Purpose: Immutable property snapshots for transaction records (Phase 3 dependency)
// This is NOT a live cache — it's a point-in-time record of listing data at time of user view.
// Phase 3 transaction engine reads from this table for immutable listing facts.
export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  mlsNumber: text('mls_number').notNull().unique(), // Unique constraint — upsert on conflict
  snapshotData: jsonb('snapshot_data').$type<RepliersListing>().notNull(),
  snapshotCapturedAt: timestamp('snapshot_captured_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Property = typeof properties.$inferSelect
export type NewProperty = typeof properties.$inferInsert
