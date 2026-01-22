import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FocusPageClient from './FocusPageClient';

export default async function FocusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dashboard');
  }

  return <FocusPageClient user={user} />;
}
