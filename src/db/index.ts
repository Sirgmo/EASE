import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

// Lazy singleton — neon() is called on first query, NOT at module load time.
// This allows Next.js to complete its build-time "collect page data" phase
// without DATABASE_URL being present. The env var is still required at runtime.
// Uses DATABASE_URL (pooled connection) for runtime queries.
// DATABASE_URL_UNPOOLED is used only by drizzle-kit (see drizzle.config.ts)

let _db: ReturnType<typeof drizzle> | undefined

export const db: ReturnType<typeof drizzle> = new Proxy(
  {} as ReturnType<typeof drizzle>,
  {
    get(_target, prop) {
      if (!_db) {
        _db = drizzle(neon(process.env.DATABASE_URL!))
      }
      return (_db as unknown as Record<string | symbol, unknown>)[prop]
    },
  }
)
