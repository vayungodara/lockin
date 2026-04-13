import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { calculateStreak } from '@/lib/streaks';
import ShareStreakClient from './ShareStreakClient';

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  // Sanitize untrusted query params to prevent XSS / metadata injection.
  // searchParams values can be `string | string[] | undefined` when the same
  // key appears multiple times (e.g. `?name=a&name=b`). Coerce to a single
  // string before calling `.replace` to avoid a TypeError on arrays.
  const rawStreak = Array.isArray(params?.streak) ? params.streak[0] : params?.streak;
  const streak = String(parseInt(rawStreak, 10) || 0);
  const rawName = Array.isArray(params?.name) ? params.name[0] : params?.name;
  const name = (rawName || 'Someone').replace(/[<>"'&]/g, '').slice(0, 50);

  return {
    title: `${name} is on a ${streak}-day streak! | LockIn`,
    description: `${name} has been crushing their goals with LockIn. Join them!`,
    openGraph: {
      title: `${streak}-day streak on LockIn!`,
      description: `${name} has been crushing their goals. Join them!`,
    },
  };
}

export default async function ShareStreakPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/?returnTo=/share/streak');
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();
  
  const streakData = await calculateStreak(supabase, user.id);
  
  return (
    <ShareStreakClient 
      user={user}
      profile={profile}
      streakData={streakData}
    />
  );
}
