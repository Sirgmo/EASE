// src/db/schema/favourites.ts
import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { users } from './users'

export const favourites = pgTable('favourites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mlsNumber: text('mls_number').notNull(),
  // Denormalized for quick display without Repliers API call
  address: text('address').notNull(),
  listPrice: text('list_price').notNull(), // Text to avoid decimal precision issues
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: user can only favourite a listing once
  userListingUnique: unique().on(table.userId, table.mlsNumber),
}))

export type Favourite = typeof favourites.$inferSelect
export type NewFavourite = typeof favourites.$inferInsert
