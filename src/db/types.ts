/**
 * Database Type Definitions
 *
 * Inferred types from Drizzle schema for use throughout the application.
 * These types are automatically derived from the schema, ensuring type safety.
 */

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  users,
  properties,
  transactions,
  transactionParties,
  transactionTasks,
  offers,
  documents,
} from './schema';

// ============================================================================
// SELECT TYPES (for reading from database)
// ============================================================================

export type User = InferSelectModel<typeof users>;
export type Property = InferSelectModel<typeof properties>;
export type Transaction = InferSelectModel<typeof transactions>;
export type TransactionParty = InferSelectModel<typeof transactionParties>;
export type TransactionTask = InferSelectModel<typeof transactionTasks>;
export type Offer = InferSelectModel<typeof offers>;
export type Document = InferSelectModel<typeof documents>;

// ============================================================================
// INSERT TYPES (for creating new records)
// ============================================================================

export type NewUser = InferInsertModel<typeof users>;
export type NewProperty = InferInsertModel<typeof properties>;
export type NewTransaction = InferInsertModel<typeof transactions>;
export type NewTransactionParty = InferInsertModel<typeof transactionParties>;
export type NewTransactionTask = InferInsertModel<typeof transactionTasks>;
export type NewOffer = InferInsertModel<typeof offers>;
export type NewDocument = InferInsertModel<typeof documents>;

// ============================================================================
// ENUM VALUE TYPES
// ============================================================================

export type UserRole =
  | 'buyer'
  | 'seller'
  | 'agent'
  | 'lawyer'
  | 'inspector'
  | 'appraiser'
  | 'lender'
  | 'title_officer'
  | 'escrow_officer'
  | 'notary'
  | 'contractor'
  | 'admin';

export type PropertyStatus =
  | 'active'
  | 'pending'
  | 'under_contract'
  | 'sold'
  | 'off_market'
  | 'withdrawn';

export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhouse'
  | 'multi_family'
  | 'land'
  | 'commercial';

export type TransactionStage =
  | 'discovery'
  | 'offer'
  | 'accepted'
  | 'diligence'
  | 'financing'
  | 'final_review'
  | 'closing'
  | 'completed'
  | 'cancelled';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'skipped'
  | 'failed';

export type OfferStatus =
  | 'draft'
  | 'submitted'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

// ============================================================================
// AI METADATA TYPES
// ============================================================================

/**
 * Common AI metadata structure present on all tables
 */
export interface BaseAIMetadata {
  embedding?: number[];
  lastAnalyzedAt?: string;
}

/**
 * User-specific AI metadata
 */
export interface UserAIMetadata extends BaseAIMetadata {
  preferenceVector?: number[];
  behaviorPatterns?: Record<string, unknown>;
  riskProfile?: Record<string, unknown>;
  communicationStyle?: string;
}

/**
 * Property-specific AI metadata
 */
export interface PropertyAIMetadata extends BaseAIMetadata {
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
}

/**
 * Transaction-specific AI metadata
 */
export interface TransactionAIMetadata extends BaseAIMetadata {
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
}

/**
 * Offer-specific AI metadata
 */
export interface OfferAIMetadata extends BaseAIMetadata {
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
}

/**
 * Document-specific AI metadata
 */
export interface DocumentAIMetadata extends BaseAIMetadata {
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
}

// ============================================================================
// COMPOSITE TYPES (with relations)
// ============================================================================

/**
 * Transaction with all related data
 */
export interface TransactionWithRelations extends Transaction {
  property: Property;
  buyer: User;
  buyerAgent?: User | null;
  parties: TransactionParty[];
  tasks: TransactionTask[];
  offers: Offer[];
  documents: Document[];
}

/**
 * Property with seller and agent
 */
export interface PropertyWithRelations extends Property {
  seller?: User | null;
  listingAgent?: User | null;
  transactions: Transaction[];
}

/**
 * Offer with parent offer chain
 */
export interface OfferWithChain extends Offer {
  parentOffer?: Offer | null;
  createdByUser?: User | null;
}
