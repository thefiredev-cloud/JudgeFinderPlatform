import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

const SYSTEM_PROMPT = `You are JudgeFinder AI, a legal information assistant for California's court system.

Your capabilities:
- Provide information about California judges and courts
- Explain bias scores and judicial analytics
- Guide users to relevant judge profiles
- Answer questions about court procedures and jurisdictions
- Help users understand judicial patterns and statistics

Important guidelines:
- NEVER provide legal advice or recommendations
- Always suggest consulting with a qualified attorney for legal matters
- Be professional, helpful, and empathetic
- Use clear, accessible language
- When mentioning specific judges, provide their full name and court
- Focus on factual information from the JudgeFinder database

Available data:
- Statewide California judge directory with bias analytics
- Court coverage across jurisdictions
- AI-powered bias detection metrics
- Case history and judicial patterns
- Court jurisdictions and assignments`

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, stream = true } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get context about judges if the query mentions any
    const userQuery = messages[messages.length - 1]?.content || ''
    const context = await getRelevantContext(userQuery)

    // Build messages array with system prompt and context
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...context,
      ...messages
    ]

    if (stream) {
      // Create streaming response
      const streamResponse = await openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: chatMessages as any,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      })

      // Create a readable stream
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResponse) {
              const text = chunk.choices[0]?.delta?.content || ''
              if (text) {
                const encoded = encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                controller.enqueue(encoded)
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Non-streaming response
      const completion = await openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: chatMessages as any,
        temperature: 0.7,
        max_tokens: 1000,
      })

      const responseText = completion.choices[0]?.message?.content || ''
      
      return NextResponse.json({
        message: responseText,
        usage: completion.usage,
      })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}

async function getRelevantContext(query: string): Promise<ChatMessage[]> {
  const context: ChatMessage[] = []
  
  try {
    const supabase = await createServerClient()
    
    // Check if query mentions specific judges or courts
    const lowerQuery = query.toLowerCase()
    
    // Look for judge names (simple pattern matching)
    if (lowerQuery.includes('judge')) {
      // Extract potential judge name
      const nameMatch = query.match(/judge\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
      
      if (nameMatch) {
        const judgeName = nameMatch[1]
        
        // Search for judge in database
        const { data: judges } = await supabase
          .from('judges')
          .select('id, name, court_name, appointed_date, case_analytics')
          .ilike('name', `%${judgeName}%`)
          .limit(3)
        
        if (judges && judges.length > 0) {
          const judgeInfo = judges.map(j => 
            `Judge ${j.name} - ${j.court_name || 'Court not specified'}, appointed ${j.appointed_date || 'date unknown'}`
          ).join('\n')
          
          context.push({
            role: 'system',
            content: `Relevant judges found:\n${judgeInfo}`
          })
        }
      }
    }
    
    // Look for court mentions
    if (lowerQuery.includes('court')) {
      const { data: courts } = await supabase
        .from('courts')
        .select('id, name, location, annual_filings')
        .limit(5)
        .order('annual_filings', { ascending: false })
      
      if (courts && courts.length > 0) {
        const courtInfo = courts.map(c => 
          `${c.name} - ${c.location || 'Location not specified'}, ${c.annual_filings || 0} annual filings`
        ).join('\n')
        
        context.push({
          role: 'system',
          content: `Top California courts by activity:\n${courtInfo}`
        })
      }
    }
    
    // Add platform statistics as context
    if (lowerQuery.includes('how many') || lowerQuery.includes('statistics') || lowerQuery.includes('data')) {
      context.push({
        role: 'system',
        content: `Platform statistics:
- Total judges: statewide California coverage
- Total courts: comprehensive jurisdiction coverage
- Total cases analyzed: expanding case library
- AI bias metrics: 5 key indicators (Consistency, Decision Speed, Settlement Preference, Risk Tolerance, Predictability)
- Coverage: All California jurisdictions`
      })
    }
  } catch (error) {
    console.error('Error fetching context:', error)
  }
  
  return context
}
