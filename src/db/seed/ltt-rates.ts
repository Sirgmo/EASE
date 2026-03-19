// src/db/seed/ltt-rates.ts
// Seed script for LTT brackets and rebates in Neon
// Run: npx tsx src/db/seed/ltt-rates.ts
//
// IMPORTANT: Requires DATABASE_URL_UNPOOLED env var (direct connection, not pooled)
// Set via: export DATABASE_URL_UNPOOLED="postgresql://..."
// Or: run from project root with .env.local loaded

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { lttBrackets, lttRebates } from '../schema/lttRates'

const connectionUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!connectionUrl) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set to run seed')
}

const sql = neon(connectionUrl)
const db = drizzle(sql)

// Baseline date for existing brackets (stable since 2017)
const baselineDate = new Date('2024-01-01T00:00:00Z')
// Luxury brackets effective April 1, 2026 (City Council passed December 17, 2025)
const luxuryEffectiveDate = new Date('2026-04-01T00:00:00Z')

async function seed() {
  console.log('Seeding ltt_brackets...')

  // Ontario provincial brackets
  // NOTE: 2.5% bracket (5th) applies to residential/single-family only.
  // Condo logic handled at runtime in calculateLTT by passing different bracket arrays.
  await db.insert(lttBrackets).values([
    {
      jurisdiction: 'ontario',
      thresholdFrom: 0,
      thresholdTo: 55_000,
      rate: '0.0050',
      applicableFrom: baselineDate,
      notes: 'First bracket 0.5%',
    },
    {
      jurisdiction: 'ontario',
      thresholdFrom: 55_000,
      thresholdTo: 250_000,
      rate: '0.0100',
      applicableFrom: baselineDate,
      notes: 'Second bracket 1.0%',
    },
    {
      jurisdiction: 'ontario',
      thresholdFrom: 250_000,
      thresholdTo: 400_000,
      rate: '0.0150',
      applicableFrom: baselineDate,
      notes: 'Third bracket 1.5%',
    },
    {
      jurisdiction: 'ontario',
      thresholdFrom: 400_000,
      thresholdTo: 2_000_000,
      rate: '0.0200',
      applicableFrom: baselineDate,
      notes: 'Fourth bracket 2.0%',
    },
    {
      jurisdiction: 'ontario',
      thresholdFrom: 2_000_000,
      thresholdTo: null,
      rate: '0.0250',
      applicableFrom: baselineDate,
      propertyType: 'residential',
      notes: 'Fifth bracket 2.5% — residential only; condos continue at 2%',
    },
  ])

  // Toronto MLTT standard brackets
  await db.insert(lttBrackets).values([
    {
      jurisdiction: 'toronto',
      thresholdFrom: 0,
      thresholdTo: 55_000,
      rate: '0.0050',
      applicableFrom: baselineDate,
    },
    {
      jurisdiction: 'toronto',
      thresholdFrom: 55_000,
      thresholdTo: 250_000,
      rate: '0.0100',
      applicableFrom: baselineDate,
    },
    {
      jurisdiction: 'toronto',
      thresholdFrom: 250_000,
      thresholdTo: 400_000,
      rate: '0.0150',
      applicableFrom: baselineDate,
    },
    {
      jurisdiction: 'toronto',
      thresholdFrom: 400_000,
      thresholdTo: 2_000_000,
      rate: '0.0200',
      applicableFrom: baselineDate,
    },
    {
      jurisdiction: 'toronto',
      thresholdFrom: 2_000_000,
      thresholdTo: 3_000_000,
      rate: '0.0250',
      applicableFrom: baselineDate,
    },
    // Luxury brackets — effective April 1, 2026 (City Council passed December 17, 2025)
    {
      jurisdiction: 'toronto',
      thresholdFrom: 3_000_000,
      thresholdTo: 4_000_000,
      rate: '0.0440',
      applicableFrom: luxuryEffectiveDate,
      notes: 'Luxury bracket effective April 1 2026 — $3M–$4M at 4.40%',
    },
    {
      jurisdiction: 'toronto',
      thresholdFrom: 4_000_000,
      thresholdTo: 5_000_000,
      rate: '0.0545',
      applicableFrom: luxuryEffectiveDate,
      notes: 'Luxury bracket effective April 1 2026 — $4M–$5M at 5.45%',
    },
    {
      jurisdiction: 'toronto',
      thresholdFrom: 5_000_000,
      thresholdTo: 10_000_000,
      rate: '0.0650',
      applicableFrom: luxuryEffectiveDate,
      notes: 'Luxury bracket effective April 1 2026 — $5M–$10M at 6.50%',
    },
    {
      jurisdiction: 'toronto',
      thresholdFrom: 10_000_000,
      thresholdTo: 20_000_000,
      rate: '0.0755',
      applicableFrom: luxuryEffectiveDate,
      notes: 'Luxury bracket effective April 1 2026 — $10M–$20M at 7.55%',
    },
    {
      jurisdiction: 'toronto',
      thresholdFrom: 20_000_000,
      thresholdTo: null,
      rate: '0.0860',
      applicableFrom: luxuryEffectiveDate,
      notes: 'Luxury bracket effective April 1 2026 — $20M+ at 8.60%',
    },
  ])

  // First-time buyer rebate caps
  console.log('Seeding ltt_rebates...')
  await db.insert(lttRebates).values([
    {
      jurisdiction: 'ontario',
      rebateType: 'first_time_buyer',
      maxRebateAmount: 4_000,
      applicableFrom: baselineDate,
    },
    {
      jurisdiction: 'toronto',
      rebateType: 'first_time_buyer',
      maxRebateAmount: 4_475,
      applicableFrom: baselineDate,
    },
  ])

  console.log('Seeding complete. ltt_brackets and ltt_rebates populated.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
