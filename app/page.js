import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingPageClient from '@/components/LandingPageClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'LockIn - Stop Procrastinating, Start Delivering',
  description: 'The accountability app that uses social pressure to help you follow through.',
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <LandingPageClient />
}
