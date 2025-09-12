/**
 * Judicial Analytics AI Pipeline
 * Uses Google Gemini 1.5 Flash for cost-effective bias analysis
 * Analyzes real case documents to generate judicial pattern insights
 */

const { GoogleGenerativeAI } = require('@google/generative-ai')

// Initialize Gemini AI
let genAI = null

function initializeGemini() {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is required')
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  }
  
  return genAI
}

// Judicial analytics prompts
const ANALYTICS_PROMPTS = {
  bias_analysis: `You are a legal analytics expert analyzing judicial patterns for transparency purposes.

Analyze the following case documents from Judge {JUDGE_NAME} and provide an objective assessment of judicial patterns.

CRITICAL REQUIREMENTS:
1. Base analysis ONLY on provided case documents - no assumptions
2. Provide confidence scores (60-95%) based on data quality and quantity
3. If insufficient data exists for any category, report confidence below 70%
4. Focus on factual patterns, not personal bias accusations
5. Consider case complexity and legal standards

JUDGE INFORMATION:
- Name: {JUDGE_NAME}
- Court: {COURT_NAME}
- Years on Bench: {YEARS_EXPERIENCE}
- Case Documents Analyzed: {DOCUMENT_COUNT}

CASE DOCUMENTS TO ANALYZE:
{CASE_DOCUMENTS}

Analyze these documents and provide percentage estimates for:

1. **Civil Litigation**: In cases with clear plaintiff vs defendant outcomes, what percentage favor plaintiffs?
2. **Child Custody**: In custody disputes, what percentage of awards go to mothers vs fathers?
3. **Alimony Decisions**: What percentage of divorce cases result in alimony being awarded?
4. **Contract Enforcement**: What percentage of contract disputes result in enforcement vs dismissal?
5. **Criminal Sentencing**: On a scale where 0% = lenient, 100% = strict, where does this judge fall?
6. **Plea Acceptance**: What percentage of plea deals are accepted vs rejected?

For each category, also provide:
- Confidence Score (60-95%): Based on data quality, quantity, and case complexity
- Sample Size: Number of relevant cases analyzed
- Notable Patterns: Any significant trends observed

Return response as JSON:
{
  "civil_plaintiff_favor": 52,
  "confidence_civil": 78,
  "sample_size_civil": 12,
  "family_custody_mother": 48,
  "confidence_custody": 82,
  "sample_size_custody": 15,
  "family_alimony_favorable": 35,
  "confidence_alimony": 71,
  "sample_size_alimony": 8,
  "contract_enforcement_rate": 68,
  "confidence_contracts": 85,
  "sample_size_contracts": 22,
  "criminal_sentencing_severity": 55,
  "confidence_sentencing": 79,
  "sample_size_sentencing": 18,
  "criminal_plea_acceptance": 72,
  "confidence_plea": 73,
  "sample_size_plea": 11,
  "overall_confidence": 76,
  "total_cases_analyzed": {DOCUMENT_COUNT},
  "analysis_quality": "high",
  "notable_patterns": ["Consistent application of legal standards", "Thorough consideration of case facts"],
  "data_limitations": ["Limited family law cases", "Most cases from recent 2 years"]
}`

}

/**
 * Generate judicial analytics using Gemini AI
 * @param {Object} judge - Judge information
 * @param {Array} caseDocuments - Array of case document objects
 * @returns {Object} Analytics results
 */
async function generateJudicialAnalytics(judge, caseDocuments) {
  try {
    const genAI = initializeGemini()
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      }
    })

    // Prepare case documents for analysis
    const documentSummaries = caseDocuments
      .filter(doc => doc.analyzable && doc.plain_text)
      .slice(0, 50) // Limit to 50 most relevant cases
      .map(doc => ({
        case_name: doc.case_name,
        decision_date: doc.decision_date,
        category: doc.case_category,
        subcategory: doc.case_subcategory,
        outcome: doc.case_outcome,
        summary: doc.plain_text.substring(0, 1000) + '...' // First 1000 chars
      }))

    if (documentSummaries.length === 0) {
      return generateFallbackAnalytics(judge, 'insufficient_data')
    }

    // Calculate years of experience
    const appointedDate = judge.appointed_date ? new Date(judge.appointed_date) : null
    const yearsExperience = appointedDate ? 
      new Date().getFullYear() - appointedDate.getFullYear() : 'Unknown'

    // Prepare the prompt
    const prompt = ANALYTICS_PROMPTS.bias_analysis
      .replace(/{JUDGE_NAME}/g, judge.name)
      .replace(/{COURT_NAME}/g, judge.court_name || 'Unknown Court')
      .replace(/{YEARS_EXPERIENCE}/g, yearsExperience)
      .replace(/{DOCUMENT_COUNT}/g, documentSummaries.length)
      .replace(/{CASE_DOCUMENTS}/g, JSON.stringify(documentSummaries, null, 2))

    // Make the AI request
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    let analyticsData
    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analyticsData = JSON.parse(jsonMatch[0])
      } else {
        analyticsData = JSON.parse(text)
      }
    } catch (parseError) {
      // console.error('Failed to parse AI response:', parseError)
      // console.log('Raw response:', text)
      return generateFallbackAnalytics(judge, 'parse_error')
    }

    // Validate and normalize the data
    const analytics = validateAndNormalizeAnalytics(analyticsData, documentSummaries.length)
    
    return {
      ...analytics,
      ai_model: 'gemini-1.5-flash',
      generated_at: new Date().toISOString(),
      input_tokens: estimateTokens(prompt),
      output_tokens: estimateTokens(text)
    }

  } catch (error) {
    // console.error('Gemini AI error:', error)
    return generateFallbackAnalytics(judge, 'ai_error', error.message)
  }
}/**
 * Validate and normalize analytics data
 */
function validateAndNormalizeAnalytics(data, documentCount) {
  const normalized = {
    civil_plaintiff_favor: Math.min(95, Math.max(5, data.civil_plaintiff_favor || 50)),
    civil_defendant_favor: 100 - (data.civil_plaintiff_favor || 50),
    family_custody_mother: Math.min(95, Math.max(5, data.family_custody_mother || 50)),
    family_custody_father: 100 - (data.family_custody_mother || 50),
    family_alimony_favorable: Math.min(95, Math.max(5, data.family_alimony_favorable || 40)),
    contract_enforcement_rate: Math.min(95, Math.max(5, data.contract_enforcement_rate || 65)),
    contract_dismissal_rate: 100 - (data.contract_enforcement_rate || 65),
    criminal_sentencing_severity: Math.min(95, Math.max(5, data.criminal_sentencing_severity || 50)),
    criminal_plea_acceptance: Math.min(95, Math.max(5, data.criminal_plea_acceptance || 70)),
    
    // Confidence scores (minimum 60%, maximum 95%)
    confidence_civil: Math.min(95, Math.max(60, data.confidence_civil || 70)),
    confidence_custody: Math.min(95, Math.max(60, data.confidence_custody || 70)),
    confidence_alimony: Math.min(95, Math.max(60, data.confidence_alimony || 70)),
    confidence_contracts: Math.min(95, Math.max(60, data.confidence_contracts || 70)),
    confidence_sentencing: Math.min(95, Math.max(60, data.confidence_sentencing || 70)),
    confidence_plea: Math.min(95, Math.max(60, data.confidence_plea || 70)),
    
    // Overall metrics
    overall_confidence: Math.min(95, Math.max(60, data.overall_confidence || 70)),
    total_cases_analyzed: documentCount,
    
    // Sample sizes
    sample_size_civil: data.sample_size_civil || 0,
    sample_size_custody: data.sample_size_custody || 0,
    sample_size_alimony: data.sample_size_alimony || 0,
    sample_size_contracts: data.sample_size_contracts || 0,
    sample_size_sentencing: data.sample_size_sentencing || 0,
    sample_size_plea: data.sample_size_plea || 0,
    
    // Qualitative data
    analysis_quality: data.analysis_quality || 'medium',
    notable_patterns: data.notable_patterns || [],
    data_limitations: data.data_limitations || [],
    
    last_updated: new Date().toISOString()
  }
  
  return normalized
}

/**
 * Generate fallback analytics when AI fails
 */
function generateFallbackAnalytics(judge, reason, errorMessage = '') {
  // console.log(`⚠️  Generating fallback analytics for ${judge.name}: ${reason}`)
  
  const baseAnalytics = {
    civil_plaintiff_favor: 50,
    civil_defendant_favor: 50,
    family_custody_mother: 50,
    family_custody_father: 50,
    family_alimony_favorable: 40,
    contract_enforcement_rate: 65,
    contract_dismissal_rate: 35,
    criminal_sentencing_severity: 50,
    criminal_plea_acceptance: 70,
    
    // Low confidence for fallback data
    confidence_civil: 60,
    confidence_custody: 60,
    confidence_alimony: 60,
    confidence_contracts: 60,
    confidence_sentencing: 60,
    confidence_plea: 60,
    overall_confidence: 60,
    
    total_cases_analyzed: 0,
    sample_size_civil: 0,
    sample_size_custody: 0,
    sample_size_alimony: 0,
    sample_size_contracts: 0,
    sample_size_sentencing: 0,
    sample_size_plea: 0,
    
    analysis_quality: 'fallback',
    notable_patterns: ['Insufficient data for meaningful analysis'],
    data_limitations: [`Fallback due to: ${reason}`, errorMessage].filter(Boolean),
    
    ai_model: 'fallback',
    generated_at: new Date().toISOString(),
    input_tokens: 0,
    output_tokens: 0,
    last_updated: new Date().toISOString()
  }
  
  return baseAnalytics
}

/**
 * Estimate token count for cost tracking
 */
function estimateTokens(text) {
  if (!text) return 0
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}

/**
 * OpenAI fallback for when Gemini fails
 */
async function generateAnalyticsWithOpenAI(judge, caseDocuments) {
  const OpenAI = require('openai')
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required for fallback')
  }
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  
  try {
    // Prepare simplified prompt for OpenAI
    const documentSummaries = caseDocuments
      .filter(doc => doc.analyzable && doc.plain_text)
      .slice(0, 30) // Smaller limit for OpenAI
      .map(doc => ({
        case_name: doc.case_name,
        category: doc.case_category,
        outcome: doc.case_outcome,
        summary: doc.plain_text.substring(0, 500) + '...'
      }))
    
    if (documentSummaries.length === 0) {
      return generateFallbackAnalytics(judge, 'no_openai_data')
    }
    
    const prompt = `Analyze these ${documentSummaries.length} case documents for Judge ${judge.name} and provide judicial pattern percentages.

Cases: ${JSON.stringify(documentSummaries)}

Return only JSON with these fields:
- civil_plaintiff_favor (0-100)
- family_custody_mother (0-100)  
- family_alimony_favorable (0-100)
- contract_enforcement_rate (0-100)
- criminal_sentencing_severity (0-100)
- criminal_plea_acceptance (0-100)
- overall_confidence (60-95)
- notable_patterns (array)

Base confidence on case quantity and quality.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a legal analytics expert. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      return generateFallbackAnalytics(judge, 'no_openai_response')
    }

    // Parse and validate OpenAI response
    const data = JSON.parse(responseText)
    const analytics = validateAndNormalizeAnalytics(data, documentSummaries.length)
    
    return {
      ...analytics,
      ai_model: 'gpt-4o-mini-fallback',
      generated_at: new Date().toISOString(),
      input_tokens: estimateTokens(prompt),
      output_tokens: estimateTokens(responseText)
    }
    
  } catch (error) {
    // console.error('OpenAI fallback failed:', error)
    return generateFallbackAnalytics(judge, 'openai_error', error.message)
  }
}

module.exports = {
  generateJudicialAnalytics,
  generateAnalyticsWithOpenAI,
  validateAndNormalizeAnalytics,
  generateFallbackAnalytics,
  initializeGemini
}