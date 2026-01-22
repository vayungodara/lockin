import { createClient } from '@/lib/supabase/server';
import PactsPageClient from './PactsPageClient';

export const metadata = {
  title: 'My Pacts | LockIn',
  description: 'View and manage all your pacts',
};

export default async function PactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return <PactsPageClient user={user} />;
}
