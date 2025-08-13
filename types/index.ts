export interface Judge {
  id: string
  name: string
  court_id: string
  court_name: string
  jurisdiction: string
  appointed_date: string
  education: string
  profile_image_url?: string
  bio: string
  total_cases: number
  reversal_rate: number
  average_decision_time: number
  created_at: string
  updated_at: string
}

export interface Court {
  id: string
  name: string
  type: 'federal' | 'state' | 'local'
  jurisdiction: string
  address: string
  phone: string
  website: string
  judge_count: number
  created_at: string
  updated_at: string
}

export interface Case {
  id: string
  case_number: string
  case_name: string
  judge_id: string
  court_id: string
  case_type: string
  filing_date: string
  decision_date?: string
  status: 'pending' | 'decided' | 'settled' | 'dismissed'
  outcome?: string
  summary?: string
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

export interface SearchResult {
  judges: Judge[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
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