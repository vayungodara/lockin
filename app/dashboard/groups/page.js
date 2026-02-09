import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GroupsPageClient from './GroupsPageClient';

export const metadata = {
  title: 'Groups | LockIn',
  description: 'Manage your group projects and tasks',
};

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <GroupsPageClient user={user} />;
}
