import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import JoinPageClient from './JoinPageClient';

export default async function JoinPage({ params }) {
  const { code } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/?returnTo=/join/${code}`);
  }
  
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name, description, invite_code')
    .eq('invite_code', code.toUpperCase())
    .single();
  
  if (groupError || !group) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Invalid Invite Link</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          This invite code doesn&apos;t exist or has expired.
        </p>
        <Link href="/dashboard/groups" style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--accent-primary)',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 500
        }}>
          Go to Groups
        </Link>
      </div>
    );
  }
  
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single();
  
  if (existingMember) {
    redirect(`/dashboard/groups/${group.id}`);
  }
  
  return <JoinPageClient group={group} user={user} />;
}
