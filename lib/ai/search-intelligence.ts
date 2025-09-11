/**
 * AI-Powered Search Intelligence Service
 * Uses Google Gemini for natural language processing and intelligent search
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null

function initializeGemini(): GoogleGenerativeAI {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY is required for AI search')
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  }
  
  return genAI
}

interface SearchIntent {
  type: 'judge' | 'court' | 'jurisdiction' | 'mixed'
  searchType: 'name' | 'characteristic' | 'location' | 'case_type' | 'general'
  extractedEntities: {
    names?: string[]
    locations?: string[]
    characteristics?: string[]
    caseTypes?: string[]
  }
  confidence: number
}

interface EnhancedQuery {
  originalQuery: string
  processedQuery: string
  searchIntent: SearchIntent
  expandedTerms: string[]
  suggestions: string[]
  conversationalResponse?: string
}

interface SearchContext {
  previousQueries?: string[]
  userLocation?: string
  searchHistory?: any[]
}

/**
 * Process natural language query with Gemini AI
 */
export async function processNaturalLanguageQuery(
  query: string,
  context?: SearchContext
): Promise<EnhancedQuery> {
  try {
    const genAI = initializeGemini()
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    })

    const contextInfo = context ? `
Previous searches: ${context.previousQueries?.join(', ') || 'none'}
User location: ${context.userLocation || 'California'}
` : ''

    const prompt = `You are an AI assistant helping users search for judges, courts, and jurisdictions in California's legal system.

Analyze this search query and provide structured search intelligence:
Query: "${query}"
${contextInfo}

Provide a JSON response with:
1. Search intent detection (what type of entity they're looking for)
2. Extracted entities (names, locations, characteristics)
3. Expanded search terms (synonyms, related terms)
4. Smart suggestions for refining the search
5. Conversational understanding of the query

Example queries to understand:
- "Find judges who handle divorce in LA" -> Looking for judges by case type and location
- "Judge Smith Orange County" -> Looking for specific judge by name and location
- "Strict judges criminal cases" -> Looking for judges by characteristic and case type
- "Court near me" -> Looking for courts by location
- "How do I find my judge" -> General help query

Return JSON:
{
  "intent": {
    "type": "judge|court|jurisdiction|mixed",
    "searchType": "name|characteristic|location|case_type|general",
    "extractedEntities": {
      "names": ["Judge Smith"],
      "locations": ["Los Angeles", "Orange County"],
      "characteristics": ["strict", "lenient", "fair"],
      "caseTypes": ["divorce", "criminal", "civil"]
    },
    "confidence": 0.95
  },
  "processedQuery": "optimized search query",
  "expandedTerms": ["synonym1", "related_term"],
  "suggestions": [
    "Try searching for 'Judge Smith Los Angeles Superior Court'",
    "Browse all judges in Orange County",
    "Filter by criminal case specialization"
  ],
  "conversationalResponse": "I understand you're looking for..."
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON response
    let aiData: any
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0])
      } else {
        aiData = JSON.parse(text)
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      return getFallbackEnhancement(query)
    }

    return {
      originalQuery: query,
      processedQuery: aiData.processedQuery || query,
      searchIntent: {
        type: aiData.intent?.type || 'mixed',
        searchType: aiData.intent?.searchType || 'general',
        extractedEntities: aiData.intent?.extractedEntities || {},
        confidence: aiData.intent?.confidence || 0.7
      },
      expandedTerms: aiData.expandedTerms || [],
      suggestions: aiData.suggestions || [],
      conversationalResponse: aiData.conversationalResponse
    }

  } catch (error) {
    console.error('Gemini AI search error:', error)
    return getFallbackEnhancement(query)
  }
}

/**
 * Generate smart search suggestions based on partial input
 */
export async function generateSearchSuggestions(
  partialQuery: string,
  recentSearches?: string[]
): Promise<string[]> {
  if (partialQuery.length < 2) return []

  try {
    const genAI = initializeGemini()
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 256,
      }
    })

    const prompt = `Generate smart search suggestions for California judicial system based on partial input.

Partial query: "${partialQuery}"
Recent searches: ${recentSearches?.join(', ') || 'none'}

Provide 5 relevant search suggestions that would help the user find judges, courts, or legal information.
Consider common judge names, court names, jurisdictions, and case types in California.

Return JSON array of suggestions:
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Failed to parse suggestions:', e)
    }
  } catch (error) {
    console.error('Suggestion generation error:', error)
  }

  // Fallback suggestions
  return getStaticSuggestions(partialQuery)
}

/**
 * Rank search results using AI
 */
export async function rankSearchResults(
  results: any[],
  query: string,
  userIntent?: SearchIntent
): Promise<any[]> {
  if (results.length === 0) return results

  try {
    const genAI = initializeGemini()
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512,
      }
    })

    const resultsPreview = results.slice(0, 10).map((r, i) => ({
      index: i,
      title: r.title || r.name,
      type: r.type,
      description: r.description || r.subtitle
    }))

    const prompt = `Rank these search results by relevance to the user's query.

Query: "${query}"
Intent: ${userIntent ? JSON.stringify(userIntent) : 'unknown'}

Results to rank:
${JSON.stringify(resultsPreview, null, 2)}

Return a JSON array of indices in order of relevance (most relevant first):
[0, 2, 1, 3, ...]`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const rankings = JSON.parse(jsonMatch[0])
        const rankedResults = rankings.map((idx: number) => results[idx]).filter(Boolean)
        const remainingResults = results.slice(10)
        return [...rankedResults, ...remainingResults]
      }
    } catch (e) {
      console.error('Failed to parse rankings:', e)
    }
  } catch (error) {
    console.error('Ranking error:', error)
  }

  return results
}

/**
 * Generate conversational response for no results
 */
export async function generateNoResultsHelp(
  query: string,
  searchType: string
): Promise<string> {
  try {
    const genAI = initializeGemini()
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 256,
      }
    })

    const prompt = `Generate a helpful message for a user who searched for "${query}" in the California judicial system but got no results.

Provide a brief, friendly response with:
1. Acknowledgment of what they searched for
2. Possible reasons for no results
3. 2-3 specific suggestions for alternative searches
4. Encouragement to try the browse feature

Keep it concise and helpful.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()

  } catch (error) {
    console.error('No results help generation error:', error)
    return `No results found for "${query}". Try searching with different terms or browse our complete directory of California judges and courts.`
  }
}

/**
 * Fallback enhancement when AI is unavailable
 */
function getFallbackEnhancement(query: string): EnhancedQuery {
  const lowerQuery = query.toLowerCase()
  
  // Simple intent detection
  let type: SearchIntent['type'] = 'mixed'
  let searchType: SearchIntent['searchType'] = 'general'
  
  if (lowerQuery.includes('judge')) type = 'judge'
  else if (lowerQuery.includes('court')) type = 'court'
  else if (lowerQuery.includes('county') || lowerQuery.includes('jurisdiction')) type = 'jurisdiction'
  
  if (lowerQuery.includes('near') || lowerQuery.includes('location')) searchType = 'location'
  else if (lowerQuery.includes('divorce') || lowerQuery.includes('criminal') || lowerQuery.includes('civil')) searchType = 'case_type'
  
  return {
    originalQuery: query,
    processedQuery: query,
    searchIntent: {
      type,
      searchType,
      extractedEntities: {},
      confidence: 0.5
    },
    expandedTerms: [],
    suggestions: [
      'Try searching by judge name',
      'Browse judges by jurisdiction',
      'Search for specific courts'
    ]
  }
}

/**
 * Static suggestions fallback
 */
function getStaticSuggestions(partial: string): string[] {
  const suggestions = [
    'Judge Smith Los Angeles',
    'Judge Martinez Orange County',
    'Judge Johnson San Diego',
    'California Superior Court',
    'Federal Court California',
    'Criminal Court judges',
    'Family Court Los Angeles',
    'Civil litigation judges'
  ]
  
  return suggestions
    .filter(s => s.toLowerCase().includes(partial.toLowerCase()))
    .slice(0, 5)
}

/**
 * Extract location from query
 */
export function extractLocation(query: string): string | null {
  const locations = [
    'Los Angeles', 'LA', 'Orange County', 'OC', 'San Diego', 'San Francisco', 'SF',
    'Sacramento', 'Alameda', 'Santa Clara', 'Riverside', 'San Bernardino'
  ]
  
  const lowerQuery = query.toLowerCase()
  for (const location of locations) {
    if (lowerQuery.includes(location.toLowerCase())) {
      return location
    }
  }
  
  return null
}

/**
 * Extract case type from query
 */
export function extractCaseType(query: string): string | null {
  const caseTypes = [
    'criminal', 'civil', 'family', 'divorce', 'custody', 'probate',
    'traffic', 'small claims', 'juvenile', 'bankruptcy'
  ]
  
  const lowerQuery = query.toLowerCase()
  for (const caseType of caseTypes) {
    if (lowerQuery.includes(caseType)) {
      return caseType
    }
  }
  
  return null
}