// src/lib/ai/schemas/doc-summary.ts
import { z } from 'zod'

export const DocSummaryOutputSchema = z.object({
  documentType: z.string().min(1),
  parties: z.array(z.string()).min(1),
  keyTerms: z.array(
    z.object({
      term: z.string(),
      explanation: z.string().min(10),
      citation: z.string().min(1),
    })
  ).min(1),
  redFlags: z.array(
    z.object({
      flag: z.string(),
      explanation: z.string().min(10),
      citation: z.string().min(1),
    })
  ),
  citations: z.array(z.string()).min(1),
  lawyerFooter: z.literal('This is a summary only. Always verify with your lawyer before signing.'),
})

export type DocSummaryOutput = z.infer<typeof DocSummaryOutputSchema>
