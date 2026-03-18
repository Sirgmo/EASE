import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Use DATABASE_URL_UNPOOLED (direct connection) for migrations.
    // DATABASE_URL is pooled via PgBouncer and incompatible with prepared statement migrations.
    // See: https://neon.com/docs/connect/connection-pooling#drizzle-config
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
} satisfies Config
