import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core'

export const documentCategoryEnum = pgEnum('document_category', [
  'agreement_of_purchase_sale',
  'condition_waiver',
  'notice_of_fulfillment',
  'home_inspection_report',
  'title_search',
  'lawyer_letter',
  'mortgage_commitment',
  'status_certificate',
  'other',
])

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id').notNull(),
    uploaderUserId: uuid('uploader_user_id').notNull(),
    r2Key: text('r2_key').notNull(),
    fileName: text('file_name').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    contentType: text('content_type').notNull(),
    category: documentCategoryEnum('category').notNull().default('other'),
    docusignEnvelopeId: text('docusign_envelope_id'),
    signedAt: timestamp('signed_at', { withTimezone: true }),
    previousVersionId: uuid('previous_version_id'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('docs_transaction_id_idx').on(table.transactionId),
    index('docs_envelope_id_idx').on(table.docusignEnvelopeId),
  ]
)

export const documentAccessRoles = pgTable(
  'document_access_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id').notNull(),
    role: text('role').notNull(),
  },
  (table) => [
    index('doc_access_doc_id_idx').on(table.documentId),
  ]
)

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type DocumentAccessRole = typeof documentAccessRoles.$inferSelect
