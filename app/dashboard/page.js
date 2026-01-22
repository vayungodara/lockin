import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export const metadata = {
  title: 'Dashboard | LockIn',
  description: 'Your personal accountability dashboard',
}

export default async function Dashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Show sign-in page
    return <DashboardClient user={null} />
  }

  return <DashboardClient user={user} />
}
