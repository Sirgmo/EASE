/**
 * EASE Database Schema
 *
 * Drizzle ORM schema for PostgreSQL
 * Designed for complex real estate transactions with 15-25 parties
 *
 * Key Design Decisions:
 * 1. Every table has `ai_metadata` (JSONB) for AI-first architecture
 * 2. Soft deletes via `deleted_at` for audit trail
 * 3. Full timestamp tracking on all tables
 * 4. UUID primary keys for distributed systems compatibility
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * User roles in the system
 * Extensible to support the 15-25 parties in a transaction
 */
export const userRoleEnum = pgEnum('user_role', [
  'buyer',
  'seller',
  'agent',
  'lawyer',
  'inspector',
  'appraiser',
  'lender',
  'title_officer',
  'escrow_officer',
  'notary',
  'contractor',
  'admin',
]);

/**
 * Property listing status
 */
export const propertyStatusEnum = pgEnum('property_status', [
  'active',
  'pending',
  'under_contract',
  'sold',
  'off_market',
  'withdrawn',
]);

/**
 * Property type classification
 */
export const propertyTypeEnum = pgEnum('property_type', [
  'single_family',
  'condo',
  'townhouse',
  'multi_family',
  'land',
  'commercial',
]);

/**
 * Transaction stages - the core workflow
 */
export const transactionStageEnum = pgEnum('transaction_stage', [
  'discovery',      // Buyer is exploring options
  'offer',          // Offer submitted, negotiation
  'accepted',       // Offer accepted, preparing diligence
  'diligence',      // Inspections, appraisal, title search
  'financing',      // Loan processing
  'final_review',   // Final walkthrough, document review
  'closing',        // Signing and funding
  'completed',      // Transaction complete
  'cancelled',      // Transaction fell through
]);

/**
 * Task status for transaction milestones
 */
export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'in_progress',
  'blocked',
  'completed',
  'skipped',
  'failed',
]);

/**
 * Offer status
 */
export const offerStatusEnum = pgEnum('offer_status', [
  'draft',
  'submitted',
  'countered',
  'accepted',
  'rejected',
  'withdrawn',
  'expired',
]);

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * Users Table
 *
 * Represents all parties in a transaction: buyers, sellers, agents, lawyers,
 * inspectors, appraisers, lenders, title officers, etc.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }),
    role: userRoleEnum('role').notNull().default('buyer'),

    // Profile information
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    avatarUrl: varchar('avatar_url', { length: 500 }),

    // Professional info (for service providers)
    companyName: varchar('company_name', { length: 255 }),
    licenseNumber: varchar('license_number', { length: 100 }),
    licenseState: varchar('license_state', { length: 2 }),

    // Extended profile data (flexible JSONB)
    profileData: jsonb('profile_data').$type<{
      bio?: string;
      specializations?: string[];
      serviceAreas?: string[];
      yearsExperience?: number;
      certifications?: string[];
      languages?: string[];
      socialLinks?: Record<string, string>;
    }>(),

    // AI-First: Store embeddings, preferences, behavior patterns
    aiMetadata: jsonb('ai_metadata').$type<{
      embedding?: number[];
      preferenceVector?: number[];
      behaviorPatterns?: Record<string, unknown>;
      lastAnalyzedAt?: string;
      riskProfile?: Record<string, unknown>;
      communicationStyle?: string;
    }>(),

    // Verification & status
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_role_idx').on(table.role),
    index('users_active_idx').on(table.isActive),
  ]
);

/**
 * Properties Table
 *
 * Real estate listings enriched with AI analysis.
 * Stores both raw listing data and computed AI insights.
 */
export const properties = pgTable(
  'properties',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Address components (structured for geocoding & search)
    streetAddress: varchar('street_address', { length: 255 }).notNull(),
    unit: varchar('unit', { length: 50 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 2 }).notNull(),
    zipCode: varchar('zip_code', { length: 10 }).notNull(),
    county: varchar('county', { length: 100 }),
    country: varchar('country', { length: 2 }).notNull().default('US'),

    // Geocoding
    latitude: real('latitude'),
    longitude: real('longitude'),

    // Listing details
    listingPrice: integer('listing_price').notNull(), // Stored in cents
    propertyType: propertyTypeEnum('property_type').notNull(),
    status: propertyStatusEnum('status').notNull().default('active'),

    // Property characteristics
    bedrooms: integer('bedrooms'),
    bathrooms: real('bathrooms'), // 2.5 baths
    sqft: integer('sqft'),
    lotSizeSqft: integer('lot_size_sqft'),
    yearBuilt: integer('year_built'),
    parkingSpaces: integer('parking_spaces'),
    stories: integer('stories'),

    // Financial data
    annualPropertyTax: integer('annual_property_tax'), // Cents
    hoaMonthlyFee: integer('hoa_monthly_fee'), // Cents
    estimatedInsurance: integer('estimated_insurance'), // Annual, cents

    // AI-Computed Values (our competitive advantage)
    aiRiskScore: real('ai_risk_score'), // 0.0 - 1.0 (lower is better)
    aiEstimatedValue: integer('ai_estimated_value'), // Cents
    aiConfidenceScore: real('ai_confidence_score'), // 0.0 - 1.0
    aiLastAnalyzedAt: timestamp('ai_last_analyzed_at', { withTimezone: true }),

    // Extended property data
    features: jsonb('features').$type<{
      interior?: string[];
      exterior?: string[];
      appliances?: string[];
      flooring?: string[];
      heating?: string[];
      cooling?: string[];
      utilities?: string[];
      accessibility?: string[];
    }>(),

    // Media
    images: jsonb('images').$type<{
      url: string;
      caption?: string;
      isPrimary?: boolean;
      order?: number;
    }[]>(),

    // AI-First: Rich analysis storage
    aiMetadata: jsonb('ai_metadata').$type<{
      embedding?: number[];
      riskFactors?: {
        category: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
        dataSource?: string;
      }[];
      comparables?: {
        propertyId: string;
        soldPrice: number;
        soldDate: string;
        similarity: number;
      }[];
      marketTrends?: {
        priceChange30d?: number;
        priceChange90d?: number;
        daysOnMarketAvg?: number;
        inventoryLevel?: string;
      };
      neighborhoodData?: Record<string, unknown>;
      environmentalRisks?: Record<string, unknown>;
      lastFullAnalysis?: string;
    }>(),

    // MLS data
    mlsNumber: varchar('mls_number', { length: 50 }),
    mlsSource: varchar('mls_source', { length: 100 }),

    // Ownership
    sellerId: uuid('seller_id').references(() => users.id),
    listingAgentId: uuid('listing_agent_id').references(() => users.id),

    // Timestamps
    listedAt: timestamp('listed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('properties_status_idx').on(table.status),
    index('properties_city_state_idx').on(table.city, table.state),
    index('properties_zip_idx').on(table.zipCode),
    index('properties_price_idx').on(table.listingPrice),
    index('properties_type_idx').on(table.propertyType),
    index('properties_risk_score_idx').on(table.aiRiskScore),
    index('properties_geo_idx').on(table.latitude, table.longitude),
    uniqueIndex('properties_mls_idx').on(table.mlsNumber, table.mlsSource),
  ]
);

/**
 * Transactions Table
 *
 * The core "Deal" object linking a property and buyer.
 * Orchestrates the entire transaction workflow.
 */
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Core relationships
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id),
    buyerAgentId: uuid('buyer_agent_id').references(() => users.id),

    // Transaction state
    currentStage: transactionStageEnum('current_stage').notNull().default('discovery'),

    // Key dates
    targetCloseDate: timestamp('target_close_date', { withTimezone: true }),
    actualCloseDate: timestamp('actual_close_date', { withTimezone: true }),
    contractDate: timestamp('contract_date', { withTimezone: true }),

    // Financial summary (cached for quick access)
    purchasePrice: integer('purchase_price'), // Cents - final agreed price
    earnestMoneyDeposit: integer('earnest_money_deposit'), // Cents
    estimatedClosingCosts: integer('estimated_closing_costs'), // Cents

    // AI-computed transaction health
    aiHealthScore: real('ai_health_score'), // 0.0 - 1.0
    aiRiskLevel: varchar('ai_risk_level', { length: 20 }), // low, medium, high, critical
    aiEstimatedCloseDate: timestamp('ai_estimated_close_date', { withTimezone: true }),

    // AI-First: Transaction intelligence
    aiMetadata: jsonb('ai_metadata').$type<{
      embedding?: number[];
      riskAssessment?: {
        overallScore: number;
        factors: {
          name: string;
          score: number;
          trend: 'improving' | 'stable' | 'declining';
        }[];
        lastUpdated: string;
      };
      timelineAnalysis?: {
        originalEstimate: string;
        currentEstimate: string;
        delayRisk: number;
        criticalPath: string[];
      };
      communicationSummary?: {
        totalMessages: number;
        sentimentTrend: number[];
        keyTopics: string[];
      };
      recommendations?: {
        action: string;
        priority: 'low' | 'medium' | 'high';
        reason: string;
      }[];
    }>(),

    // Notes and flags
    internalNotes: text('internal_notes'),
    isFlagged: boolean('is_flagged').notNull().default(false),
    flagReason: varchar('flag_reason', { length: 255 }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('transactions_property_idx').on(table.propertyId),
    index('transactions_buyer_idx').on(table.buyerId),
    index('transactions_stage_idx').on(table.currentStage),
    index('transactions_close_date_idx').on(table.targetCloseDate),
    index('transactions_health_idx').on(table.aiHealthScore),
  ]
);

/**
 * Transaction Parties Table
 *
 * Links all participants (15-25 parties) to a transaction.
 * Each party has a specific role and responsibilities.
 */
export const transactionParties = pgTable(
  'transaction_parties',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: userRoleEnum('role').notNull(),

    // Party-specific details
    isPrimary: boolean('is_primary').notNull().default(false), // Primary contact for this role
    responsibilities: jsonb('responsibilities').$type<string[]>(),

    // AI-First metadata
    aiMetadata: jsonb('ai_metadata').$type<{
      performanceScore?: number;
      responseTimeAvg?: number;
      taskCompletionRate?: number;
      communicationQuality?: number;
    }>(),

    // Status
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('tx_parties_transaction_idx').on(table.transactionId),
    index('tx_parties_user_idx').on(table.userId),
    index('tx_parties_role_idx').on(table.role),
    uniqueIndex('tx_parties_unique_idx').on(table.transactionId, table.userId, table.role),
  ]
);

/**
 * Transaction Tasks Table
 *
 * Milestones and tasks that need to be completed during a transaction.
 * Supports both human and AI-automated tasks.
 */
export const transactionTasks = pgTable(
  'transaction_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),

    // Task definition
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }), // inspection, financing, legal, etc.

    // Assignment
    assignedRole: userRoleEnum('assigned_role'), // Which role is responsible
    assignedUserId: uuid('assigned_user_id').references(() => users.id), // Specific user

    // AI automation
    isAiTask: boolean('is_ai_task').notNull().default(false),
    aiAgentType: varchar('ai_agent_type', { length: 100 }), // document_review, risk_analysis, etc.

    // Status and timing
    status: taskStatusEnum('status').notNull().default('pending'),
    priority: integer('priority').notNull().default(0), // Higher = more urgent
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Dependencies
    dependsOnTaskIds: jsonb('depends_on_task_ids').$type<string[]>(),
    blockedReason: text('blocked_reason'),

    // Results
    outcome: jsonb('outcome').$type<{
      success: boolean;
      summary?: string;
      findings?: Record<string, unknown>[];
      documents?: string[];
      nextSteps?: string[];
    }>(),

    // AI-First: Task intelligence
    aiMetadata: jsonb('ai_metadata').$type<{
      embedding?: number[];
      estimatedDuration?: number; // minutes
      completionProbability?: number;
      automationPotential?: number;
      suggestedActions?: string[];
      relatedDocuments?: string[];
    }>(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('tx_tasks_transaction_idx').on(table.transactionId),
    index('tx_tasks_status_idx').on(table.status),
    index('tx_tasks_assigned_user_idx').on(table.assignedUserId),
    index('tx_tasks_due_date_idx').on(table.dueDate),
    index('tx_tasks_ai_idx').on(table.isAiTask),
  ]
);

/**
 * Offers Table
 *
 * Tracks negotiation history for a transaction.
 * Includes AI-computed win probability.
 */
export const offers = pgTable(
  'offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),

    // Offer details
    amount: integer('amount').notNull(), // Cents
    earnestMoney: integer('earnest_money'), // Cents
    downPaymentPercent: real('down_payment_percent'),
    financingType: varchar('financing_type', { length: 50 }), // cash, conventional, FHA, VA

    // Conditions and contingencies
    conditions: jsonb('conditions').$type<{
      inspectionContingency?: boolean;
      inspectionDays?: number;
      financingContingency?: boolean;
      financingDays?: number;
      appraisalContingency?: boolean;
      saleContingency?: boolean;
      saleContingencyAddress?: string;
      otherConditions?: string[];
    }>(),

    // Closing terms
    requestedCloseDate: timestamp('requested_close_date', { withTimezone: true }),
    possessionDate: timestamp('possession_date', { withTimezone: true }),

    // Offer status
    status: offerStatusEnum('status').notNull().default('draft'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // Counter offer chain (self-reference handled in relations)
    parentOfferId: uuid('parent_offer_id'),
    counterAmount: integer('counter_amount'), // Seller's counter, cents
    counterConditions: jsonb('counter_conditions').$type<Record<string, unknown>>(),

    // AI analysis
    aiWinProbability: real('ai_win_probability'), // 0.0 - 1.0
    aiStrengthScore: real('ai_strength_score'), // 0.0 - 1.0
    aiRecommendation: varchar('ai_recommendation', { length: 50 }), // accept, counter, reject

    // AI-First: Offer intelligence
    aiMetadata: jsonb('ai_metadata').$type<{
      embedding?: number[];
      comparableOffers?: {
        amount: number;
        outcome: string;
        similarity: number;
      }[];
      marketPositioning?: {
        percentile: number;
        competitiveness: string;
        suggestedRange: { min: number; max: number };
      };
      riskFactors?: string[];
      negotiationInsights?: string[];
      optimalCounterAmount?: number;
    }>(),

    // Metadata
    createdBy: uuid('created_by').references(() => users.id),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('offers_transaction_idx').on(table.transactionId),
    index('offers_status_idx').on(table.status),
    index('offers_parent_idx').on(table.parentOfferId),
    index('offers_win_prob_idx').on(table.aiWinProbability),
  ]
);

/**
 * Documents Table
 *
 * All documents associated with a transaction.
 * Supports AI-powered document analysis.
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    transactionId: uuid('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),

    // Document info
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 100 }).notNull(), // contract, disclosure, inspection, etc.
    mimeType: varchar('mime_type', { length: 100 }),
    fileSize: integer('file_size'), // bytes
    storageUrl: varchar('storage_url', { length: 500 }).notNull(),

    // Status
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    uploadedBy: uuid('uploaded_by').references(() => users.id),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

    // AI analysis results
    aiAnalyzed: boolean('ai_analyzed').notNull().default(false),
    aiAnalyzedAt: timestamp('ai_analyzed_at', { withTimezone: true }),

    // AI-First: Document intelligence
    aiMetadata: jsonb('ai_metadata').$type<{
      embedding?: number[];
      extractedText?: string;
      summary?: string;
      keyTerms?: {
        term: string;
        value: string;
        confidence: number;
        location?: string;
      }[];
      flags?: {
        type: string;
        severity: 'info' | 'warning' | 'critical';
        description: string;
        pageNumber?: number;
      }[];
      signatures?: {
        name: string;
        signed: boolean;
        signedAt?: string;
        pageNumber?: number;
      }[];
      ocrConfidence?: number;
    }>(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('documents_transaction_idx').on(table.transactionId),
    index('documents_type_idx').on(table.type),
    index('documents_status_idx').on(table.status),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  ownedProperties: many(properties, { relationName: 'seller' }),
  listedProperties: many(properties, { relationName: 'listingAgent' }),
  buyerTransactions: many(transactions, { relationName: 'buyer' }),
  agentTransactions: many(transactions, { relationName: 'buyerAgent' }),
  transactionParties: many(transactionParties),
  assignedTasks: many(transactionTasks),
  createdOffers: many(offers),
  uploadedDocuments: many(documents, { relationName: 'uploader' }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  seller: one(users, {
    fields: [properties.sellerId],
    references: [users.id],
    relationName: 'seller',
  }),
  listingAgent: one(users, {
    fields: [properties.listingAgentId],
    references: [users.id],
    relationName: 'listingAgent',
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  property: one(properties, {
    fields: [transactions.propertyId],
    references: [properties.id],
  }),
  buyer: one(users, {
    fields: [transactions.buyerId],
    references: [users.id],
    relationName: 'buyer',
  }),
  buyerAgent: one(users, {
    fields: [transactions.buyerAgentId],
    references: [users.id],
    relationName: 'buyerAgent',
  }),
  parties: many(transactionParties),
  tasks: many(transactionTasks),
  offers: many(offers),
  documents: many(documents),
}));

export const transactionPartiesRelations = relations(transactionParties, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionParties.transactionId],
    references: [transactions.id],
  }),
  user: one(users, {
    fields: [transactionParties.userId],
    references: [users.id],
  }),
}));

export const transactionTasksRelations = relations(transactionTasks, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionTasks.transactionId],
    references: [transactions.id],
  }),
  assignedUser: one(users, {
    fields: [transactionTasks.assignedUserId],
    references: [users.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  transaction: one(transactions, {
    fields: [offers.transactionId],
    references: [transactions.id],
  }),
  parentOffer: one(offers, {
    fields: [offers.parentOfferId],
    references: [offers.id],
  }),
  createdBy: one(users, {
    fields: [offers.createdBy],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  transaction: one(transactions, {
    fields: [documents.transactionId],
    references: [transactions.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
    relationName: 'uploader',
  }),
  reviewer: one(users, {
    fields: [documents.reviewedBy],
    references: [users.id],
  }),
}));
