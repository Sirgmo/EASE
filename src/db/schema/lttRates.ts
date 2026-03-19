import { pgTable, uuid, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core'

// Database-configurable LTT brackets and rebates
// CRITICAL: Toronto luxury brackets (April 1, 2026) must be stored here, not hardcoded.
// Rates can change via DB update without requiring a code deploy.

export const lttBrackets = pgTable('ltt_brackets', {
  id: uuid('id').primaryKey().defaultRandom(),
  jurisdiction: text('jurisdiction').notNull(),             // 'ontario' | 'toronto'
  thresholdFrom: integer('threshold_from').notNull(),       // Lower bound (inclusive)
  thresholdTo: integer('threshold_to'),                     // Upper bound (exclusive); NULL = infinity
  rate: numeric('rate', { precision: 6, scale: 4 }).notNull(), // e.g. '0.0440' for 4.40%
  applicableFrom: timestamp('applicable_from', { withTimezone: true }).notNull(),
  applicableTo: timestamp('applicable_to', { withTimezone: true }), // NULL = currently active
  propertyType: text('property_type'),                      // NULL = all; 'residential' = house only
  notes: text('notes'),
})

export const lttRebates = pgTable('ltt_rebates', {
  id: uuid('id').primaryKey().defaultRandom(),
  jurisdiction: text('jurisdiction').notNull(),
  rebateType: text('rebate_type').notNull(),                // 'first_time_buyer'
  maxRebateAmount: integer('max_rebate_amount').notNull(),  // $4000 Ontario, $4475 Toronto
  applicableFrom: timestamp('applicable_from', { withTimezone: true }).notNull(),
  applicableTo: timestamp('applicable_to', { withTimezone: true }),
})

export type LttBracket = typeof lttBrackets.$inferSelect
export type LttRebate = typeof lttRebates.$inferSelect
