import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

// Singleton Drizzle client using Neon's HTTP driver
// Uses DATABASE_URL (pooled connection) for runtime queries
// DATABASE_URL_UNPOOLED is used only by drizzle-kit (see drizzle.config.ts)
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)
