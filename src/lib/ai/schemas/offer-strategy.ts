// src/lib/ai/schemas/offer-strategy.ts
import { z } from 'zod'

export const OfferStrategyOutputSchema = z.object({
  priceRangeLow: z.number().positive(),
  priceRangeHigh: z.number().positive(),
  saleToListRatio: z.number().min(0.5).max(1.5),
  negotiationContext: z.string().min(20),
  recommendedConditions: z.array(z.string()).min(1),
  comparableSalesSummary: z.string().min(20),
  confidenceNote: z.string().min(10),
}).refine(
  (d) => d.priceRangeHigh > d.priceRangeLow,
  { message: 'priceRangeHigh must be greater than priceRangeLow — never output a single price' }
)

export type OfferStrategyOutput = z.infer<typeof OfferStrategyOutputSchema>
