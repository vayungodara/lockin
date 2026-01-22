const REACTIONS = [
  { emoji: '🔥', label: 'Fire', key: 'fire' },
  { emoji: '👏', label: 'Clap', key: 'clap' },
  { emoji: '💪', label: 'Strong', key: 'strong' },
  { emoji: '😬', label: 'Yikes', key: 'yikes' },
  { emoji: '❤️', label: 'Love', key: 'love' }
];

export { REACTIONS };

export async function getReactions(supabase, activityId) {
  try {
    const { data, error } = await supabase
      .from('activity_reactions')
      .select('*')
      .eq('activity_id', activityId);

    if (error) throw error;

    const reactionCounts = {};
    const userReactions = new Set();
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const user = authData?.user;
    
    (data || []).forEach(r => {
      reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1;
      if (user && r.user_id === user.id) {
        userReactions.add(r.reaction);
      }
    });

    return { 
      counts: reactionCounts, 
      userReactions: [...userReactions],
      total: data?.length || 0,
      error: null 
    };
  } catch (err) {
    console.error('Error getting reactions:', err);
    return { counts: {}, userReactions: [], total: 0, error: err };
  }
}

export async function getBatchReactions(supabase, activityIds) {
  if (!activityIds || activityIds.length === 0) {
    return { reactionsMap: {}, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('activity_reactions')
      .select('*')
      .in('activity_id', activityIds);

    if (error) throw error;

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    const reactionsMap = {};
    activityIds.forEach(id => {
      reactionsMap[id] = { counts: {}, userReactions: [], total: 0 };
    });

    (data || []).forEach(r => {
      if (!reactionsMap[r.activity_id]) {
        reactionsMap[r.activity_id] = { counts: {}, userReactions: [], total: 0 };
      }
      const entry = reactionsMap[r.activity_id];
      entry.counts[r.reaction] = (entry.counts[r.reaction] || 0) + 1;
      entry.total++;
      if (userId && r.user_id === userId) {
        entry.userReactions.push(r.reaction);
      }
    });

    return { reactionsMap, error: null };
  } catch (err) {
    console.error('Error getting batch reactions:', err);
    return { reactionsMap: {}, error: err };
  }
}

export async function toggleReaction(supabase, activityId, reaction) {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const user = authData?.user;
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: existing, error: existingError } = await supabase
      .from('activity_reactions')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .eq('reaction', reaction)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existing) {
      const { error } = await supabase
        .from('activity_reactions')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      return { success: true, action: 'removed' };
    } else {
      const { error } = await supabase
        .from('activity_reactions')
        .insert({
          activity_id: activityId,
          user_id: user.id,
          reaction
        });
      
      if (error) throw error;
      return { success: true, action: 'added' };
    }
  } catch (err) {
    console.error('Error toggling reaction:', err);
    return { success: false, error: err };
  }
}
