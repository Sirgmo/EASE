// src/lib/ai/anthropic.ts
// Anthropic provider initialisation for Vercel AI SDK
// Uses process.env directly (like CRON_SECRET, STRIPE_SECRET_KEY) to avoid
// Zod envSchema.parse() throwing in test environments where ANTHROPIC_API_KEY is absent.
import { createAnthropic } from '@ai-sdk/anthropic'

// createAnthropic() without explicit apiKey auto-reads ANTHROPIC_API_KEY from process.env.
// This avoids exactOptionalPropertyTypes issues since the env var is required at runtime.
export const anthropic = createAnthropic()

// Model constants — use Haiku for cost-sensitive ops, Sonnet for complex analysis
export const HAIKU_MODEL = 'claude-3-5-haiku-20241022'
export const SONNET_MODEL = 'claude-3-5-sonnet-20241022'
