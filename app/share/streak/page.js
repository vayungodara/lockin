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
  const hasStreakParam = rawStreak != null && rawStreak !== '';
  const paramStreak = parseInt(rawStreak, 10) || 0;
  const rawName = Array.isArray(params?.name) ? params.name[0] : params?.name;

  // The page is auth-gated and always renders the *viewer's own* calculated
  // streak + name. So the title should match that card, not the URL param.
  // Only fall back to the param for unauthenticated link-preview crawlers
  // (where the param carries the sharer's numbers for the OG card).
  let streakValue = paramStreak;
  let nameValue = rawName;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [profileRes, streakData] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        calculateStreak(supabase, user.id),
      ]);
      streakValue = streakData?.currentStreak ?? streakValue;
      if (!hasStreakParam) {
        nameValue = profileRes.data?.full_name || nameValue;
      }
    }
  } catch {
    // Fall back to the sanitized param values below.
  }

  const streak = String(streakValue);
  const name = (nameValue || 'Someone').replace(/[<>"'&]/g, '').slice(0, 50);

  return {
    title: `${name} is on a ${streak}-day streak! | LockIn`,
    description: `${name} hasn't broken the chain on LockIn. Join them.`,
    openGraph: {
      title: `${streak}-day streak on LockIn!`,
      description: `${name} hasn't broken the chain. Join them.`,
    },
  };
}

export default async function ShareStreakPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?returnTo=/share/streak');
  }

  // Parallelize profile fetch + streak calculation (streak can scan up to
  // 366 days of pacts). Matches the pattern used in TodayBar.
  const [profileRes, streakData] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single(),
    calculateStreak(supabase, user.id),
  ]);

  const profile = profileRes.data;

  return (
    <ShareStreakClient
      user={user}
      profile={profile}
      streakData={streakData}
    />
  );
}
