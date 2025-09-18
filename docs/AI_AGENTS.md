# AI Agents & Analytics

## Primary Agent
- Model: Google Gemini 1.5 Flash
- Location: `lib/ai/judicial-analytics.js`
- Purpose: Generate judge bias/pattern analytics with confidence scores and normalization.

Output example:
```
{
  civil_plaintiff_favor: 52,
  confidence_civil: 78,
  family_custody_mother: 48,
  criminal_sentencing_severity: 55,
  overall_confidence: 76,
  notable_patterns: ["Consistent legal standards", "Thorough case review"],
  ai_model: "gemini-1.5-flash"
}
```

Key features:
- Structured prompts with 60–95% confidence bands
- Fallback analytics when data is insufficient
- Output normalization + token usage tracking

## Fallback Agent
- Model: OpenAI GPT‑4o‑mini
- Location: `lib/ai/judicial-analytics.js`
- Purpose: Generate compatible analytics when Gemini is unavailable.

## UI Integration
- Visualization: `components/judges/BiasPatternAnalysis.tsx`
- Bias indicators displayed: Consistency, Speed, Settlement Preference, Risk Tolerance, Predictability

## Caching
- Strategy: Cached analytics to reduce API costs
- Invalidation: On new decision data or profile updates

