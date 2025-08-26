import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, judge_id, judge_name, source, metadata } = body
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event parameter is required' },
        { status: 400 }
      )
    }
    
    // Track the event (in production, this would go to analytics service)
    const eventData = {
      event_type: event,
      judge_id,
      judge_name,
      source: source || 'chat',
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
      // Add user session info if available
      session_id: request.headers.get('x-session-id') || 'anonymous',
      user_agent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    }
    
    // Log to console for now (in production, send to analytics service)
    console.log('Chat Funnel Event:', eventData)
    
    // Optional: Store in database for reporting
    const supabase = await createServerClient()
    
    // Try to insert into analytics table if it exists
    try {
      const { error } = await supabase
        .from('chat_analytics')
        .insert({
          event_type: event,
          judge_id,
          judge_name,
          source,
          metadata: JSON.stringify(metadata || {}),
          created_at: new Date().toISOString()
        })
      
      if (error) {
        // Table might not exist, that's okay
        console.log('Analytics table not found, skipping database insert')
      }
    } catch (dbError) {
      // Silently fail - analytics shouldn't break the app
      console.log('Analytics database error:', dbError)
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      event: event,
      timestamp: eventData.timestamp
    })
    
  } catch (error) {
    console.error('Analytics error:', error)
    // Don't fail the request just because analytics failed
    return NextResponse.json({
      success: false,
      error: 'Analytics error but request processed'
    })
  }
}