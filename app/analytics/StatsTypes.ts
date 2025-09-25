export interface DashboardStats {
  totalJudges: number | null
  totalCourts: number | null
  totalCases: number | null
  pendingSync: number
  lastSyncTime: string | null
  systemHealth: 'healthy' | 'warning' | 'error'
  activeUsers: number | null
  searchVolume: number | null
  syncSuccessRate: number
  retryCount: number
  cacheHitRatio: number
  latencyP50: number | null
  latencyP95: number | null
}

export interface FreshnessRow {
  court_id: string
  court_name: string
  last_update: string | null
}


