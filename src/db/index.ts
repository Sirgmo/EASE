/**
 * Database Client Module
 *
 * Provides the Drizzle ORM client for database operations.
 * Uses postgres.js driver for optimal performance.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    '⚠️  DATABASE_URL not set. Database operations will fail. ' +
      'Set DATABASE_URL in your .env.local file.'
  );
}

// Create postgres.js client
// For serverless environments, we use a connection pool
const client = connectionString
  ? postgres(connectionString, {
      max: 10, // Maximum connections in pool
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout
    })
  : (null as unknown as ReturnType<typeof postgres>);

// Create Drizzle client with schema for relational queries
export const db = client
  ? drizzle(client, { schema })
  : (null as unknown as ReturnType<typeof drizzle>);

// Export schema for use in queries
export * from './schema';

// Type exports for use throughout the app
export type Database = typeof db;
