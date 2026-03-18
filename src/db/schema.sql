-- EASE Database Schema
-- PostgreSQL DDL (for reference - use Drizzle migrations in production)
--
-- This schema supports:
-- - 15-25 parties per transaction
-- - AI-first architecture with ai_metadata JSONB on every table
-- - Full audit trail with timestamps and soft deletes

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
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
  'admin'
);

CREATE TYPE property_status AS ENUM (
  'active',
  'pending',
  'under_contract',
  'sold',
  'off_market',
  'withdrawn'
);

CREATE TYPE property_type AS ENUM (
  'single_family',
  'condo',
  'townhouse',
  'multi_family',
  'land',
  'commercial'
);

CREATE TYPE transaction_stage AS ENUM (
  'discovery',
  'offer',
  'accepted',
  'diligence',
  'financing',
  'final_review',
  'closing',
  'completed',
  'cancelled'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'blocked',
  'completed',
  'skipped',
  'failed'
);

CREATE TYPE offer_status AS ENUM (
  'draft',
  'submitted',
  'countered',
  'accepted',
  'rejected',
  'withdrawn',
  'expired'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users: All parties in the transaction ecosystem
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  role user_role NOT NULL DEFAULT 'buyer',

  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url VARCHAR(500),

  -- Professional info
  company_name VARCHAR(255),
  license_number VARCHAR(100),
  license_state VARCHAR(2),

  -- Extended data
  profile_data JSONB,

  -- AI-First: embeddings, preferences, behavior patterns
  ai_metadata JSONB,

  -- Status
  email_verified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);
CREATE INDEX users_active_idx ON users(is_active);

-- Properties: Real estate listings with AI enrichment
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Address
  street_address VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  county VARCHAR(100),
  country VARCHAR(2) NOT NULL DEFAULT 'US',

  -- Geocoding
  latitude REAL,
  longitude REAL,

  -- Listing
  listing_price INTEGER NOT NULL, -- Cents
  property_type property_type NOT NULL,
  status property_status NOT NULL DEFAULT 'active',

  -- Characteristics
  bedrooms INTEGER,
  bathrooms REAL,
  sqft INTEGER,
  lot_size_sqft INTEGER,
  year_built INTEGER,
  parking_spaces INTEGER,
  stories INTEGER,

  -- Financial
  annual_property_tax INTEGER, -- Cents
  hoa_monthly_fee INTEGER, -- Cents
  estimated_insurance INTEGER, -- Cents

  -- AI-Computed (our competitive advantage)
  ai_risk_score REAL, -- 0.0 - 1.0
  ai_estimated_value INTEGER, -- Cents
  ai_confidence_score REAL, -- 0.0 - 1.0
  ai_last_analyzed_at TIMESTAMPTZ,

  -- Extended data
  features JSONB,
  images JSONB,

  -- AI-First: risk factors, comparables, market trends
  ai_metadata JSONB,

  -- MLS
  mls_number VARCHAR(50),
  mls_source VARCHAR(100),

  -- Ownership
  seller_id UUID REFERENCES users(id),
  listing_agent_id UUID REFERENCES users(id),

  -- Timestamps
  listed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX properties_status_idx ON properties(status);
CREATE INDEX properties_city_state_idx ON properties(city, state);
CREATE INDEX properties_zip_idx ON properties(zip_code);
CREATE INDEX properties_price_idx ON properties(listing_price);
CREATE INDEX properties_type_idx ON properties(property_type);
CREATE INDEX properties_risk_score_idx ON properties(ai_risk_score);
CREATE INDEX properties_geo_idx ON properties(latitude, longitude);
CREATE UNIQUE INDEX properties_mls_idx ON properties(mls_number, mls_source);

-- Transactions: The core "Deal" object
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationships
  property_id UUID NOT NULL REFERENCES properties(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  buyer_agent_id UUID REFERENCES users(id),

  -- State
  current_stage transaction_stage NOT NULL DEFAULT 'discovery',

  -- Dates
  target_close_date TIMESTAMPTZ,
  actual_close_date TIMESTAMPTZ,
  contract_date TIMESTAMPTZ,

  -- Financial summary
  purchase_price INTEGER, -- Cents
  earnest_money_deposit INTEGER, -- Cents
  estimated_closing_costs INTEGER, -- Cents

  -- AI health metrics
  ai_health_score REAL, -- 0.0 - 1.0
  ai_risk_level VARCHAR(20), -- low, medium, high, critical
  ai_estimated_close_date TIMESTAMPTZ,

  -- AI-First: risk assessment, timeline, recommendations
  ai_metadata JSONB,

  -- Notes
  internal_notes TEXT,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX transactions_property_idx ON transactions(property_id);
CREATE INDEX transactions_buyer_idx ON transactions(buyer_id);
CREATE INDEX transactions_stage_idx ON transactions(current_stage);
CREATE INDEX transactions_close_date_idx ON transactions(target_close_date);
CREATE INDEX transactions_health_idx ON transactions(ai_health_score);

-- Transaction Parties: Links all 15-25 participants
CREATE TABLE transaction_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role user_role NOT NULL,

  -- Details
  is_primary BOOLEAN NOT NULL DEFAULT false,
  responsibilities JSONB,

  -- AI-First: performance metrics
  ai_metadata JSONB,

  -- Status
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(transaction_id, user_id, role)
);

CREATE INDEX tx_parties_transaction_idx ON transaction_parties(transaction_id);
CREATE INDEX tx_parties_user_idx ON transaction_parties(user_id);
CREATE INDEX tx_parties_role_idx ON transaction_parties(role);

-- Transaction Tasks: Milestones and AI tasks
CREATE TABLE transaction_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,

  -- Task definition
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),

  -- Assignment
  assigned_role user_role,
  assigned_user_id UUID REFERENCES users(id),

  -- AI automation
  is_ai_task BOOLEAN NOT NULL DEFAULT false,
  ai_agent_type VARCHAR(100),

  -- Status
  status task_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Dependencies
  depends_on_task_ids JSONB,
  blocked_reason TEXT,

  -- Results
  outcome JSONB,

  -- AI-First: duration estimates, automation potential
  ai_metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tx_tasks_transaction_idx ON transaction_tasks(transaction_id);
CREATE INDEX tx_tasks_status_idx ON transaction_tasks(status);
CREATE INDEX tx_tasks_assigned_user_idx ON transaction_tasks(assigned_user_id);
CREATE INDEX tx_tasks_due_date_idx ON transaction_tasks(due_date);
CREATE INDEX tx_tasks_ai_idx ON transaction_tasks(is_ai_task);

-- Offers: Negotiation history
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,

  -- Offer details
  amount INTEGER NOT NULL, -- Cents
  earnest_money INTEGER,
  down_payment_percent REAL,
  financing_type VARCHAR(50),

  -- Conditions
  conditions JSONB,

  -- Closing terms
  requested_close_date TIMESTAMPTZ,
  possession_date TIMESTAMPTZ,

  -- Status
  status offer_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Counter offer chain
  parent_offer_id UUID REFERENCES offers(id),
  counter_amount INTEGER,
  counter_conditions JSONB,

  -- AI analysis
  ai_win_probability REAL, -- 0.0 - 1.0
  ai_strength_score REAL,
  ai_recommendation VARCHAR(50),

  -- AI-First: market positioning, negotiation insights
  ai_metadata JSONB,

  -- Metadata
  created_by UUID REFERENCES users(id),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX offers_transaction_idx ON offers(transaction_id);
CREATE INDEX offers_status_idx ON offers(status);
CREATE INDEX offers_parent_idx ON offers(parent_offer_id);
CREATE INDEX offers_win_prob_idx ON offers(ai_win_probability);

-- Documents: All transaction documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,

  -- Document info
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  storage_url VARCHAR(500) NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  uploaded_by UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,

  -- AI analysis
  ai_analyzed BOOLEAN NOT NULL DEFAULT false,
  ai_analyzed_at TIMESTAMPTZ,

  -- AI-First: extracted text, key terms, flags
  ai_metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX documents_transaction_idx ON documents(transaction_id);
CREATE INDEX documents_type_idx ON documents(type);
CREATE INDEX documents_status_idx ON documents(status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_parties_updated_at
  BEFORE UPDATE ON transaction_parties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_tasks_updated_at
  BEFORE UPDATE ON transaction_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
