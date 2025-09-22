import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { resolveAdminStatus } from '@/lib/auth/is-admin'
import { fetchSyncStatus } from '@/lib/admin/sync-status'
import { createServiceRoleClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/dashboard/AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in?redirect_url=/admin')
  }

  const { isAdmin } = await resolveAdminStatus()

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-sm border border-gray-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Not authorized</h1>
          <p className="text-gray-600">
            You need administrator access to view this area. Please contact a platform admin if you
            believe this is a mistake.
          </p>
        </div>
      </div>
    )
  }

  const status = await fetchSyncStatus()

  const supabase = await createServiceRoleClient()
  const { data: issueRows } = await supabase
    .from('profile_issues')
    .select('id, judge_slug, court_id, issue_type, status, reporter_email, created_at, severity, priority, sla_due_at, last_status_change_at, breached_at')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  const statuses: Array<'new' | 'researching' | 'resolved' | 'dismissed'> = ['new', 'researching', 'resolved', 'dismissed']
  const profileIssueCounts = await Promise.all(
    statuses.map(async (statusKey) => {
      const { count } = await supabase
        .from('profile_issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', statusKey)

      return { status: statusKey, count: count || 0 }
    })
  )

  const overdueCount = (issueRows || []).reduce((total, issue) => {
    if (!issue?.sla_due_at) return total
    if (issue.status === 'resolved' || issue.status === 'dismissed') return total
    const due = new Date(issue.sla_due_at)
    if (Number.isNaN(due.getTime())) return total
    return due.getTime() < Date.now() ? total + 1 : total
  }, 0)

  return (
    <AdminDashboard
      status={status}
      profileIssues={issueRows || []}
      profileIssueCounts={profileIssueCounts}
      overdueCount={overdueCount}
    />
  )
}

export const metadata = {
  title: 'Admin Dashboard - JudgeFinder.io',
  description: 'Administrative dashboard for managing the JudgeFinder platform.',
}
