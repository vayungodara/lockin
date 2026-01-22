import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import GroupDetailClient from './GroupDetailClient';

export default async function GroupDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/dashboard');
  }

  // Check if user is a member of this group
  const { data: membership, error: memberError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single();

  if (memberError || !membership) {
    // User is not a member of this group
    redirect('/dashboard/groups');
  }

  // Fetch group details
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single();

  if (groupError || !group) {
    notFound();
  }

  return (
    <GroupDetailClient 
      user={user} 
      group={group} 
      userRole={membership.role}
    />
  );
}
