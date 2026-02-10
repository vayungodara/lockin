/**
 * Accountability partnership management
 */

/**
 * Send a partner request to another user
 */
export async function sendPartnerRequest(supabase, targetUserId) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Not authenticated' };
    if (userId === targetUserId) return { success: false, error: 'Cannot partner with yourself' };

    // Check if partnership already exists
    const { data: existing } = await supabase
      .from('accountability_partnerships')
      .select('id, status')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${userId})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') return { success: false, error: 'Already partners' };
      if (existing.status === 'pending') return { success: false, error: 'Request already pending' };
    }

    const { data, error } = await supabase
      .from('accountability_partnerships')
      .insert({
        user1_id: userId,
        user2_id: targetUserId,
        requested_by: userId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Get sender name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const { createNotification, NOTIFICATION_TYPES } = await import('@/lib/notifications');
    await createNotification(
      supabase,
      targetUserId,
      NOTIFICATION_TYPES.PARTNER_REQUEST,
      'Partner Request',
      `${profile?.full_name || 'Someone'} wants to be your accountability partner!`,
      { partnershipId: data.id, fromUserId: userId }
    );

    return { success: true, data };
  } catch (err) {
    console.error('Error sending partner request:', err);
    return { success: false, error: err.message || 'Failed to send request' };
  }
}

/**
 * Accept a partner request
 */
export async function acceptPartnerRequest(supabase, partnershipId) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('accountability_partnerships')
      .update({ status: 'active' })
      .eq('id', partnershipId)
      .select()
      .single();

    if (error) throw error;

    // Notify the requester
    const partnerId = data.user1_id === userId ? data.user2_id : data.user1_id;
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const { createNotification, NOTIFICATION_TYPES } = await import('@/lib/notifications');
    await createNotification(
      supabase,
      partnerId,
      NOTIFICATION_TYPES.PARTNER_ACCEPTED,
      'Partner Request Accepted!',
      `${profile?.full_name || 'Someone'} accepted your accountability partner request!`,
      { partnershipId }
    );

    return { success: true, data };
  } catch (err) {
    console.error('Error accepting partner request:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Decline a partner request
 */
export async function declinePartnerRequest(supabase, partnershipId) {
  try {
    const { error } = await supabase
      .from('accountability_partnerships')
      .update({ status: 'declined' })
      .eq('id', partnershipId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error declining partner request:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Remove a partnership
 */
export async function removePartnership(supabase, partnershipId) {
  try {
    const { error } = await supabase
      .from('accountability_partnerships')
      .delete()
      .eq('id', partnershipId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error removing partnership:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all partnerships for the current user
 */
export async function getPartnerships(supabase) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { data: [], error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('accountability_partnerships')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get partner profiles
    const partnerIds = (data || []).map(p =>
      p.user1_id === userId ? p.user2_id : p.user1_id
    );

    let profilesMap = {};
    if (partnerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', partnerIds);

      if (profiles) {
        profiles.forEach(p => { profilesMap[p.id] = p; });
      }
    }

    const partnerships = (data || []).map(partnership => {
      const partnerId = partnership.user1_id === userId
        ? partnership.user2_id
        : partnership.user1_id;
      return {
        ...partnership,
        partnerId,
        partner: profilesMap[partnerId] || { full_name: 'Unknown', avatar_url: null },
        isRequester: partnership.requested_by === userId
      };
    });

    return { data: partnerships, error: null };
  } catch (err) {
    console.error('Error fetching partnerships:', err);
    return { data: [], error: err };
  }
}

/**
 * Notify partner about pact activity
 */
export async function notifyPartner(supabase, userId, action, pactTitle) {
  try {
    const { data: partnerships } = await supabase
      .from('accountability_partnerships')
      .select('user1_id, user2_id')
      .eq('status', 'active')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!partnerships || partnerships.length === 0) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    const name = profile?.full_name || 'Your partner';
    const { createNotification, NOTIFICATION_TYPES } = await import('@/lib/notifications');

    for (const partnership of partnerships) {
      const partnerId = partnership.user1_id === userId
        ? partnership.user2_id
        : partnership.user1_id;

      const type = action === 'completed'
        ? NOTIFICATION_TYPES.PARTNER_PACT_COMPLETED
        : NOTIFICATION_TYPES.PARTNER_PACT_MISSED;

      const verb = action === 'completed' ? 'completed' : 'missed';

      await createNotification(
        supabase,
        partnerId,
        type,
        `Partner ${verb} a pact`,
        `${name} ${verb}: "${pactTitle}"`,
        { userId, pactTitle }
      );
    }
  } catch (err) {
    console.error('Error notifying partner:', err);
  }
}
