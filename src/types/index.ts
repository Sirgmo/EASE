/**
 * Global Type Definitions for EASE
 */

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'buyer' | 'seller' | 'admin';

// Property types
export interface Property {
  id: string;
  address: Address;
  price: number;
  type: PropertyType;
  status: PropertyStatus;
  details: PropertyDetails;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat?: number;
  lng?: number;
}

export type PropertyType = 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'land';

export type PropertyStatus = 'active' | 'pending' | 'sold' | 'off-market';

export interface PropertyDetails {
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSize?: number;
  yearBuilt: number;
  parking?: number;
  features: string[];
}

// Transaction types
export interface Transaction {
  id: string;
  propertyId: string;
  buyerId: string;
  sellerId: string;
  status: TransactionStatus;
  price: number;
  timeline: TransactionTimeline;
  documents: Document[];
  costs: TransactionCosts;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionStatus =
  | 'initiated'
  | 'offer-submitted'
  | 'under-contract'
  | 'inspection'
  | 'appraisal'
  | 'final-review'
  | 'closing'
  | 'completed'
  | 'cancelled';

export interface TransactionTimeline {
  milestones: Milestone[];
  estimatedClosing: Date;
  actualClosing?: Date;
}

export interface Milestone {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  dueDate: Date;
  completedDate?: Date;
  notes?: string;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  status: 'pending' | 'uploaded' | 'reviewed' | 'approved';
  uploadedAt: Date;
}

export type DocumentType =
  | 'purchase-agreement'
  | 'disclosure'
  | 'inspection-report'
  | 'appraisal'
  | 'title-report'
  | 'loan-documents'
  | 'closing-documents'
  | 'other';

export interface TransactionCosts {
  purchasePrice: number;
  closingCosts: number;
  escrowDeposit: number;
  inspectionFees: number;
  titleInsurance: number;
  lenderFees: number;
  taxes: number;
  total: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
