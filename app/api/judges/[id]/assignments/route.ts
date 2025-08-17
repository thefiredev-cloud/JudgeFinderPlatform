import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CurrentAssignment, AssignmentHistory } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('history') === 'true'
    const yearsBack = parseInt(searchParams.get('years') || '5')

    // Get current assignments
    const { data: currentAssignments, error: currentError } = await supabase
      .rpc('get_current_court_assignments', { judge_uuid: params.id })

    if (currentError) {
      console.error('Error fetching current assignments:', currentError)
      return NextResponse.json(
        { error: 'Failed to fetch current assignments' },
        { status: 500 }
      )
    }

    const response: {
      current_assignments: CurrentAssignment[]
      assignment_history?: AssignmentHistory[]
      summary: {
        total_current_assignments: number
        primary_court?: string
        total_workload_percentage: number
        longest_current_assignment_days?: number
      }
    } = {
      current_assignments: currentAssignments || [],
      summary: {
        total_current_assignments: currentAssignments?.length || 0,
        primary_court: currentAssignments?.find(a => a.assignment_type === 'primary')?.court_name,
        total_workload_percentage: currentAssignments?.reduce((sum, a) => sum + (a.workload_percentage || 0), 0) || 0,
        longest_current_assignment_days: currentAssignments?.length > 0 
          ? Math.max(...currentAssignments.map(a => a.days_in_position))
          : undefined
      }
    }

    // Get assignment history if requested
    if (includeHistory) {
      const { data: assignmentHistory, error: historyError } = await supabase
        .rpc('get_judge_assignment_history', { judge_uuid: params.id, years_back: yearsBack })

      if (historyError) {
        console.error('Error fetching assignment history:', historyError)
        return NextResponse.json(
          { error: 'Failed to fetch assignment history' },
          { status: 500 }
        )
      }

      response.assignment_history = assignmentHistory || []
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Assignments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const {
      court_id,
      assignment_start_date,
      assignment_end_date,
      assignment_type = 'primary',
      assignment_status = 'active',
      position_title,
      department,
      calendar_type,
      workload_percentage = 100,
      appointment_authority,
      confirmation_date,
      notes,
      metadata = {}
    } = body

    if (!court_id || !assignment_start_date) {
      return NextResponse.json(
        { error: 'Missing required fields: court_id, assignment_start_date' },
        { status: 400 }
      )
    }

    // Validate assignment using the database function
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_court_assignment', {
        p_judge_id: params.id,
        p_court_id: court_id,
        p_assignment_type: assignment_type,
        p_start_date: assignment_start_date,
        p_end_date: assignment_end_date
      })

    if (validationError) {
      console.error('Assignment validation error:', validationError)
      return NextResponse.json(
        { error: 'Failed to validate assignment' },
        { status: 500 }
      )
    }

    if (validation && validation.length > 0 && !validation[0].is_valid) {
      return NextResponse.json(
        { 
          error: 'Assignment validation failed',
          validation_errors: validation[0].validation_errors
        },
        { status: 400 }
      )
    }

    // Create the assignment
    const assignmentData = {
      judge_id: params.id,
      court_id,
      assignment_start_date,
      assignment_end_date,
      assignment_type,
      assignment_status,
      position_title,
      department,
      calendar_type,
      workload_percentage,
      appointment_authority,
      confirmation_date,
      notes,
      metadata: {
        ...metadata,
        created_via_api: true,
        creation_timestamp: new Date().toISOString()
      },
      data_source: 'api',
      last_verified_date: new Date().toISOString().split('T')[0]
    }

    const { data: newAssignment, error: insertError } = await supabase
      .from('court_assignments')
      .insert(assignmentData)
      .select(`
        *,
        judges (id, name),
        courts (id, name)
      `)
      .single()

    if (insertError) {
      console.error('Error creating assignment:', insertError)
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json(newAssignment, { status: 201 })

  } catch (error) {
    console.error('Assignment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}