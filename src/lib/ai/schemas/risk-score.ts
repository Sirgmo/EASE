// src/lib/ai/schemas/risk-score.ts
import { z } from 'zod'

export const RiskScoreOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  confidenceLow: z.number().int().min(0).max(100),
  confidenceHigh: z.number().int().min(0).max(100),
  factors: z.array(
    z.object({
      name: z.string(),
      impact: z.enum(['positive', 'negative', 'neutral']),
      explanation: z.string().min(10),
    })
  ).min(1),
  summary: z.string().min(20),
}).refine(
  (d) => d.confidenceHigh > d.confidenceLow,
  { message: 'confidenceHigh must be greater than confidenceLow' }
).refine(
  (d) => d.score >= d.confidenceLow && d.score <= d.confidenceHigh,
  { message: 'score must fall within the confidence interval' }
)

export type RiskScoreOutput = z.infer<typeof RiskScoreOutputSchema>
