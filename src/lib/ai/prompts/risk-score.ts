// src/lib/ai/prompts/risk-score.ts
// Pure function — no side effects.

export interface PropertyData {
  mlsNumber: string
  address: string
  listPrice: number
  assessedValue?: number | undefined
  yearBuilt?: number | undefined
  propertyType: string
  neighbourhood: string
  daysOnMarket?: number | undefined
}

export function buildRiskScorePrompt(propertyData: PropertyData): string {
  return `You are a property risk analyst for a Canadian real estate platform. Analyze the following property and produce a structured risk assessment.

Property details:
- MLS Number: ${propertyData.mlsNumber}
- Address: ${propertyData.address}
- List Price: $${propertyData.listPrice.toLocaleString('en-CA')}
${propertyData.assessedValue ? `- MPAC Assessed Value: $${propertyData.assessedValue.toLocaleString('en-CA')}` : ''}
${propertyData.yearBuilt ? `- Year Built: ${propertyData.yearBuilt}` : ''}
- Property Type: ${propertyData.propertyType}
- Neighbourhood: ${propertyData.neighbourhood}
${propertyData.daysOnMarket !== undefined ? `- Days on Market: ${propertyData.daysOnMarket}` : ''}

Produce a risk score from 0 (highest risk) to 100 (lowest risk) with a confidence interval.

Risk factors to consider:
1. Price vs assessed value ratio (overpriced relative to MPAC assessment = higher risk)
2. Days on market (longer than neighbourhood average = higher risk)
3. Year built (pre-1980 = higher risk due to potential renovation issues, lead paint, knob-and-tube wiring)
4. Property type risk (condo = strata/status certificate risk, detached = structural risk)
5. Neighbourhood price trend context

IMPORTANT: Always output a confidence RANGE (low and high), never a single number. State your reasoning for each factor you scored.

Do not provide legal advice. Do not make statements about specific legal rights. Stick to factual risk analysis.`
}
