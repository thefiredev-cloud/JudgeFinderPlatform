import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { resolveAdminStatus } from '@/lib/auth/is-admin'
import { fetchSyncStatus } from '@/lib/admin/sync-status'
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

  return <AdminDashboard status={status} />
}

export const metadata = {
  title: 'Admin Dashboard - JudgeFinder.io',
  description: 'Administrative dashboard for managing the JudgeFinder platform.',
}
