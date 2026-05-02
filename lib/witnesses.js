/**
 * Fetch active focus sessions from users who share a group with the viewer.
 *
 * @param {object} supabase - Browser-side Supabase client.
 * @param {string} userId - Current authenticated user ID.
 * @returns {Promise<WitnessSession[]>}
 */
export async function getActiveWitnesses(supabase, userId) {
  try {
    if (!supabase || !userId) return [];
    // Option A: client-side group discovery. Cross-user focus_sessions SELECT
    // requires supabase/migrations/20260502_witnesses_rls.sql.
    const { data: myMemberships, error: membershipsError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
    if (membershipsError) throw membershipsError;
    const groupIds = [...new Set((myMemberships || []).map(m => m.group_id).filter(Boolean))];
    if (groupIds.length === 0) return [];
    const [
      { data: members, error: membersError },
      { data: groups, error: groupsError },
    ] = await Promise.all([
      supabase.from('group_members').select('group_id, user_id').in('group_id', groupIds),
      supabase.from('groups').select('id, name').in('id', groupIds),
    ]);
    if (membersError || groupsError) throw membersError || groupsError;
    const groupNameById = Object.fromEntries((groups || []).map(group => [group.id, group.name]));
    const sharedGroupByUser = {};
    (members || []).forEach(({ user_id, group_id }) => {
      if (user_id && user_id !== userId && !sharedGroupByUser[user_id]) {
        sharedGroupByUser[user_id] = group_id;
      }
    });
    const peerUserIds = Object.keys(sharedGroupByUser);
    if (peerUserIds.length === 0) return [];
    const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
    const { data: sessions, error: sessionsError } = await supabase
      .from('focus_sessions')
      .select('user_id, started_at, duration_minutes')
      .in('user_id', peerUserIds)
      .neq('user_id', userId)
      .is('ended_at', null)
      .gte('started_at', sixHoursAgo)
      .order('started_at', { ascending: false })
      .limit(20);
    if (sessionsError) throw sessionsError;
    if (!sessions?.length) return [];
    const sessionUserIds = [...new Set(sessions.map(({ user_id }) => user_id).filter(Boolean))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', sessionUserIds);
    if (profilesError) throw profilesError;
    const profileById = Object.fromEntries((profiles || []).map(profile => [profile.id, profile]));
    return sessions.map(session => {
      const duration = session.duration_minutes || 0;
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(session.started_at)) / 60000));
      const groupId = sharedGroupByUser[session.user_id];
      return {
        user_id: session.user_id,
        name: profileById[session.user_id]?.full_name || 'Unknown',
        avatar_url: profileById[session.user_id]?.avatar_url || null,
        started_at: session.started_at,
        duration_minutes: duration,
        elapsed_minutes: elapsed,
        progress_pct: duration > 0 ? Math.min(100, Math.round((elapsed / duration) * 100)) : 0,
        group_id: groupId,
        group_name: groupNameById[groupId] || null,
      };
    });
  } catch (err) {
    console.error('Error fetching active witnesses:', err);
    return [];
  }
}
