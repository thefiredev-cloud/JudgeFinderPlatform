import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/admin'
import AdminDashboard from '@/components/dashboard/AdminDashboard'

export default async function AdminPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) {
    redirect('/') // Redirect non-admin users to home page
  }

  return <AdminDashboard />
}

export const metadata = {
  title: 'Admin Dashboard - JudgeFinder.io',
  description: 'Administrative dashboard for managing the JudgeFinder platform.',
}