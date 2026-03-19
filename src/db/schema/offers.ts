// src/db/schema/offers.ts
// Offer data tables for OREA Form 100 structured field capture
// No .references() on FK columns — avoids circular import issues across schema files

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const offerStatusEnum = pgEnum('offer_status', [
  'draft',
  'under_partner_review',
  'submitted',
  'accepted',
  'countered',
  'rejected',
  'withdrawn',
])

// ─── offers ───────────────────────────────────────────────────────────────────

export const offers = pgTable(
  'offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // transactionId references transactions.id — no .references() to avoid circular imports
    transactionId: uuid('transaction_id').notNull(),
    // Monetary values stored as integer cents to avoid floating-point errors
    purchasePrice: integer('purchase_price').notNull(),
    deposit: integer('deposit'),                   // nullable — may not be entered yet
    irrevocabilityDeadline: timestamp('irrevocability_deadline', { withTimezone: true }),
    completionDate: timestamp('completion_date', { withTimezone: true }),
    financingConditionDays: integer('financing_condition_days'),
    inspectionConditionDays: integer('inspection_condition_days'),
    // Free-text fields mapping to OREA Form 100 Schedule A items
    chattelsIncluded: text('chattels_included'),   // e.g., "Fridge, Stove, Washer/Dryer"
    fixturesExcluded: text('fixtures_excluded'),
    rentalItems: text('rental_items'),             // e.g., "Hot water heater (Enercare)"
    status: offerStatusEnum('status').notNull().default('draft'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    partnerReviewedAt: timestamp('partner_reviewed_at', { withTimezone: true }),
    // createdBy references users.id — no .references() to avoid circular imports
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('offers_transaction_id_idx').on(table.transactionId),
    index('offers_status_idx').on(table.status),
  ]
)

// ─── offerReviews ─────────────────────────────────────────────────────────────
// Created when buyer submits an offer — licensed partner picks it up from this queue

export const offerReviews = pgTable(
  'offer_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // offerId references offers.id — no .references() to avoid circular imports
    offerId: uuid('offer_id').notNull(),
    // reviewerId references users.id — nullable until a partner claims the review
    reviewerId: uuid('reviewer_id'),
    // status: pending | approved | rejected | changes_requested
    status: text('status').notNull().default('pending'),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('offer_reviews_offer_id_idx').on(table.offerId),
  ]
)

// ─── Types ────────────────────────────────────────────────────────────────────

export type Offer = typeof offers.$inferSelect
export type NewOffer = typeof offers.$inferInsert
export type OfferReview = typeof offerReviews.$inferSelect
export type NewOfferReview = typeof offerReviews.$inferInsert
