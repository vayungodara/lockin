import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StatsPageClient from './StatsPageClient';

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dashboard');
  }

  return <StatsPageClient user={user} />;
}
