export interface Judge {
  id: string
  name: string
  slug?: string // URL-friendly identifier for reliable routing
  court_id: string | null
  court_name: string | null
  court_slug?: string | null
  jurisdiction: string
  appointed_date: string | null
  education: string | null
  profile_image_url?: string | null
  bio: string | null
  total_cases: number
  reversal_rate: number
  average_decision_time: number | null
  courtlistener_id?: string | null
  courtlistener_data?: Record<string, any> | null // Full CourtListener judge data
  created_at: string
  updated_at: string
}

export interface Court {
  id: string
  name: string
  slug?: string | null
  type: 'federal' | 'state' | 'local'
  jurisdiction: string | null
  address: string | null
  phone: string | null
  website: string | null
  judge_count: number | null
  courtlistener_id?: string | null
  courthouse_metadata?: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface Case {
  id: string
  case_number: string
  case_name: string
  judge_id: string
  court_id: string | null
  case_type: string
  filing_date: string
  decision_date?: string | null
  status: 'pending' | 'decided' | 'settled' | 'dismissed'
  outcome?: string
  summary?: string | null
  courtlistener_id?: string | null
  source_url?: string | null
  jurisdiction?: string | null
  created_at: string
  updated_at: string
}

export interface AttorneySlot {
  id: string
  judge_id: string
  attorney_id?: string
  position: number
  start_date: string
  end_date?: string
  price_per_month: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Attorney {
  id: string
  user_id: string
  bar_number: string
  firm_name: string
  specialty: string
  years_experience: number
  cases_won: number
  cases_total: number
  rating: number
  verified: boolean
  created_at: string
  updated_at: string
}

export interface YearlyDecisionCount {
  year: number
  count: number
}

export interface JudgeDecisionSummary {
  judge_id: string
  yearly_counts: YearlyDecisionCount[]
  total_recent: number
}

export interface SearchResult {
  judges: Judge[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
}

// Enhanced types for judge lookups
export interface JudgeLookupResult {
  judge: Judge | null
  found_by: 'slug' | 'name_exact' | 'name_partial' | 'brute_force' | 'not_found'
  alternatives?: Judge[] // Similar judges if exact match not found
}

// Slug generation options
export interface SlugGenerationOptions {
  validateUniqueness?: boolean
  fallbackToId?: boolean
}

// Enhanced error types
export interface JudgeNotFoundError {
  code: 'JUDGE_NOT_FOUND'
  message: string
  searched_slug: string
  suggestions?: Judge[]
}

export interface AnalyticsEvent {
  id: string
  user_id?: string
  event_type: string
  event_data: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan_type: 'basic' | 'professional' | 'enterprise'
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

// Court Assignment Types
export interface CourtAssignment {
  id: string
  judge_id: string
  court_id: string
  assignment_start_date: string
  assignment_end_date?: string | null
  assignment_type: 'primary' | 'visiting' | 'temporary' | 'retired'
  assignment_status: 'active' | 'inactive' | 'pending' | 'transferred'
  position_title?: string | null
  department?: string | null
  calendar_type?: string | null
  workload_percentage: number
  appointment_authority?: string | null
  confirmation_date?: string | null
  notes?: string | null
  metadata?: Record<string, any> | null
  data_source: string
  last_verified_date: string
  created_at: string
  updated_at: string
  // Joined data
  judges?: Judge | null
  courts?: Court | null
}

export interface AssignmentChange {
  type: 'new_position' | 'position_ended' | 'position_updated' | 'court_changed'
  message: string
  severity: 'low' | 'medium' | 'high'
  suggested_action: string
  position_data?: any
}

export interface AssignmentValidationResult {
  assignment_id: string
  judge_name: string
  court_name: string
  status: 'valid' | 'has_warnings' | 'needs_manual_review'
  issues: AssignmentValidationIssue[]
  recommendations: AssignmentRecommendation[]
}

export interface AssignmentValidationIssue {
  type: string
  message: string
  severity: 'low' | 'medium' | 'high'
  conflicting_assignment_id?: string
}

export interface AssignmentRecommendation {
  assignment_id: string
  action: string
  field: string
  new_value: any
  reason: string
}

export interface AssignmentUpdateReport {
  run_time: string
  assignments_processed: number
  assignments_updated: number
  errors_encountered: number
  success_rate: string
}

export interface CurrentAssignment {
  assignment_id: string
  court_id: string
  court_name: string
  assignment_type: 'primary' | 'visiting' | 'temporary' | 'retired'
  assignment_start_date: string
  assignment_end_date?: string | null
  position_title?: string | null
  department?: string | null
  calendar_type?: string | null
  workload_percentage: number
  days_in_position: number
}

export interface AssignmentHistory {
  assignment_id: string
  court_id: string
  court_name: string
  assignment_type: 'primary' | 'visiting' | 'temporary' | 'retired'
  assignment_status: 'active' | 'inactive' | 'pending' | 'transferred'
  assignment_start_date: string
  assignment_end_date?: string | null
  position_title?: string | null
  department?: string | null
  duration_days: number
}
