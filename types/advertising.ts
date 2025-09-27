// Advertising System Types

export interface AdvertiserProfile {
  id: string
  user_id: string
  firm_name: string
  firm_type: 'solo' | 'small' | 'medium' | 'large' | 'enterprise'
  bar_number?: string
  bar_state: string
  contact_email: string
  contact_phone?: string
  billing_email?: string
  billing_address?: string
  website?: string
  logo_url?: string
  description?: string
  specializations?: string[]
  total_spend: number
  account_status: 'pending' | 'active' | 'suspended' | 'inactive'
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

export interface AdSpot {
  id: string
  entity_type: 'judge' | 'court'
  entity_id: string
  position: 1 | 2 | 3
  status: 'available' | 'booked' | 'reserved' | 'maintenance'
  base_price_monthly: number
  current_advertiser_id?: string | null
  impressions_total: number
  clicks_total: number
  court_level?: 'federal' | 'state'
  pricing_tier?: string | null
  stripe_product_lookup_key?: string | null
  stripe_price_lookup_key?: string | null
  created_at: string
  updated_at: string
}

export interface AdCampaign {
  id: string
  advertiser_id: string
  name: string
  campaign_type: 'standard' | 'premium' | 'sponsored'
  status: 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected'
  budget_total: number
  budget_spent: number
  budget_daily_limit?: number
  start_date: string
  end_date: string
  targeting_criteria?: Record<string, any>
  ad_content?: Record<string, any>
  impressions_total: number
  clicks_total: number
  approval_notes?: string
  created_at: string
  updated_at: string
}

export interface AdBooking {
  id: string
  ad_spot_id: string
  campaign_id: string
  advertiser_id: string
  booking_status: 'pending' | 'confirmed' | 'active' | 'expired' | 'cancelled'
  start_date: string
  end_date: string
  price_paid: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  stripe_payment_intent_id?: string
  stripe_invoice_id?: string
  stripe_subscription_id?: string
  impressions: number
  clicks: number
  pricing_tier_id?: string
  is_annual?: boolean
  months_purchased?: number
  created_at: string
  updated_at: string
}

export interface AdCreative {
  id: string
  campaign_id: string
  creative_type: 'text' | 'image' | 'rich'
  headline: string
  description?: string
  cta_text?: string
  cta_url?: string
  image_url?: string
  badge_text?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdPerformanceMetric {
  id: string
  booking_id: string
  campaign_id: string
  metric_date: string
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  conversion_value: number
  spend: number
  created_at: string
}

export interface BillingTransaction {
  id: string
  advertiser_id: string
  booking_id?: string
  transaction_type: 'charge' | 'refund' | 'credit' | 'adjustment'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  stripe_charge_id?: string
  stripe_refund_id?: string
  description?: string
  metadata?: Record<string, any>
  created_at: string
}

// Extended user types for advertisers
export interface AdvertiserUser {
  id: string
  email: string
  role: 'law_firm' | 'attorney' | 'advertiser'
  advertiser_profile?: AdvertiserProfile
  permissions: {
    can_create_campaigns: boolean
    can_manage_billing: boolean
    can_view_analytics: boolean
    can_book_spots: boolean
  }
}

// Dashboard statistics
export interface AdvertiserDashboardStats {
  total_campaigns: number
  active_campaigns: number
  total_spend: number
  total_impressions: number
  total_clicks: number
  average_ctr: number
  active_bookings: number
  upcoming_bookings: number
}

// Ad spot with enhanced details for display
export interface AdSpotWithDetails extends AdSpot {
  entity_name: string // Judge or Court name
  entity_details: {
    jurisdiction?: string
    court_name?: string
    case_volume?: number
    reversal_rate?: number
    court_level?: 'federal' | 'state'
  }
  availability_calendar?: {
    date: string
    available: boolean
  }[]
  pricing_quote?: PricingQuote
}

// Pricing tier interface
export interface PricingTier {
  id: string
  tier_name: string
  entity_type: 'judge' | 'court'
  court_level?: 'federal' | 'state'
  monthly_price: number
  annual_price: number
  annual_discount_months: number
  features: {
    placement: string
    analytics: string
    support: string
    visibility: string
  }
  tier_group?: string
  purchase_type?: 'subscription' | 'one_time'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PricingQuote {
  total_price: number | null
  monthly_rate: number | null
  savings: number | null
  applied_discounts?: Record<string, unknown>
}

// Campaign with advertiser details
export interface AdCampaignWithAdvertiser extends AdCampaign {
  advertiser: AdvertiserProfile
  bookings: AdBooking[]
  creatives: AdCreative[]
  performance_summary: {
    total_impressions: number
    total_clicks: number
    average_ctr: number
    total_spend: number
    roi: number
  }
}
