import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { calculateStreak } from '@/lib/streaks';
import ShareStreakClient from './ShareStreakClient';

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const streak = String(params?.streak || '0').replace(/\D/g, '').slice(0, 5) || '0';
  const name = String(params?.name || 'Someone').slice(0, 50).replace(/[<>"'&]/g, '');
  
  return {
    title: `${name} is on a ${streak}-day streak! | LockIn`,
    description: `${name} has been crushing their goals with LockIn. Join them!`,
    openGraph: {
      title: `${streak}-day streak on LockIn!`,
      description: `${name} has been crushing their goals. Join them!`,
    },
  };
}

export default async function ShareStreakPage({ searchParams }) {
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
