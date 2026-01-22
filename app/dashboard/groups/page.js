import { createClient } from '@/lib/supabase/server';
import GroupsPageClient from './GroupsPageClient';

export const metadata = {
  title: 'Groups | LockIn',
  description: 'Manage your group projects and tasks',
};

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return <GroupsPageClient user={user} />;
}
