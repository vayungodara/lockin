import { createClient } from '@/lib/supabase/server'
import DashboardLayout from './DashboardLayout'

export default async function Layout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return children
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
