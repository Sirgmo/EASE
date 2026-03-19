// src/lib/transactions/offers-validation.ts
// Pure validation for OREA Form 100 offer fields — no DB, no env dependencies
import { z } from 'zod'

export const offerSchema = z.object({
  transactionId: z.string().uuid(),
  purchasePrice: z.number().int().positive(),
  deposit: z.number().int().min(0).optional(),
  irrevocabilityDeadline: z.string().datetime().optional(),
  completionDate: z.string().datetime(),
  financingConditionDays: z.number().int().min(0).max(365).optional(),
  inspectionConditionDays: z.number().int().min(0).max(365).optional(),
  chattelsIncluded: z.string().optional(),
  fixturesExcluded: z.string().optional(),
  rentalItems: z.string().optional(),
})

export type OfferInput = z.infer<typeof offerSchema>

export type ValidationResult =
  | { success: true; data: OfferInput; errors?: undefined }
  | { success: false; errors: Record<string, string[]>; data?: undefined }

/**
 * Validates OREA Form 100 offer fields.
 * Returns success + parsed data, or failure + field-level errors.
 * No DB or environment dependencies — safe to use in tests without mocking.
 */
export function validateOfferFields(input: unknown): ValidationResult {
  const result = offerSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  // Flatten Zod errors to { fieldName: [errorMessages] }
  const errors: Record<string, string[]> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || '_root'
    if (!errors[field]) errors[field] = []
    errors[field].push(issue.message)
  }
  return { success: false, errors }
}
