import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsPageClient from './SettingsPageClient';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/dashboard');
  }

  return <SettingsPageClient user={user} />;
}
