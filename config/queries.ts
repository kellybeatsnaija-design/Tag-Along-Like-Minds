import { supabase } from './supabase';



export const OPEN_SESSION_STATUSES = ['Queued', 'Matching', 'Partially Matched', 'Waiting for Confirmation', 'Ready'];
export const CLOSED_STATUSES = ['Expired', 'Cancelled'];

export const createSessionRecord = async ({
  hostId,
  intent,
  groupSize,
  comfortMode,
  socialMood = 'Low-pressure',
  timing,
  connectionMode,
  scheduledAt,
}: {
  hostId: string;
  intent: string;
  groupSize: number;
  comfortMode: string;
  socialMood?: string;
  timing: string;
  connectionMode: string;
  scheduledAt?: string | null;
}) => {
  const payload: Record<string, any> = {
    host_id: hostId,
    intent,
    group_size: groupSize,
    comfort_mode: comfortMode,
    social_mood: socialMood || 'Low-pressure',
    timing,
    connection_mode: connectionMode,
  };
  if (scheduledAt !== undefined) payload.scheduled_at = scheduledAt;

  const { data, error } = await supabase
    .from('sessions')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSessionRecord = async (sessionId: string, updates: {
  intent?: string;
  groupSize?: number;
  comfortMode?: string;
}) => {
  const payload: Record<string, any> = {};
  if (updates.intent !== undefined) payload.intent = updates.intent;
  if (updates.groupSize !== undefined) payload.group_size = updates.groupSize;
  if (updates.comfortMode !== undefined) payload.comfort_mode = updates.comfortMode;

  const { data, error } = await supabase
    .from('sessions')
    .update(payload)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * The current user's own hosted sessions (the queue home / My Tags data source),
 * with embedded participant handshakes for status badges and avatar stacks.
 */
export const fetchMySessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id, intent, status, paused, group_size, comfort_mode, social_mood,
      connection_mode, timing, expires_at, matched_at, ready_at, completed_at,
      matched_into_session_id, created_at,
      match_handshakes ( candidate_id, status )
    `)
    .eq('host_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const candidateIds = [...new Set(
    (data || []).flatMap((row: any) =>
      (row.match_handshakes || [])
        .filter((h: any) => h.status === 'accepted')
        .map((h: any) => h.candidate_id)
    )
  )];

  const profilesById = new Map<string, { first_name: string; avatar_color: string }>();
  if (candidateIds.length > 0) {
    const cards = await fetchPublicProfileCards(candidateIds as string[]);
    cards.forEach((p: any) => profilesById.set(p.id, p));
  }

  return (data || []).map((row: any) => {
    const acceptedCandidates = (row.match_handshakes || [])
      .filter((h: any) => h.status === 'accepted')
      .map((h: any) => profilesById.get(h.candidate_id))
      .filter(Boolean);
    return { ...row, acceptedCandidates };
  });
};

export const toggleSessionPaused = async (sessionId: string, paused: boolean) => {
  const { error } = await supabase.from('sessions').update({ paused }).eq('id', sessionId);
  if (error) throw error;
};

export const cancelSession = async (sessionId: string) => {
  const { error } = await supabase.from('sessions').update({ status: 'Cancelled' }).eq('id', sessionId);
  if (error) throw error;
};

export const completeSession = async (sessionId: string) => {
  const { error } = await supabase.rpc('complete_session', { p_session_id: sessionId });
  if (error) throw error;
};

export const leaveSession = async (sessionId: string) => {
  const { error } = await supabase.rpc('leave_session', { p_session_id: sessionId });
  if (error) throw error;
};

export const REPORT_REASONS: { label: string; value: string }[] = [
  { label: 'Harassment', value: 'harassment' },
  { label: 'Made me feel unsafe', value: 'safety_concern' },
  { label: 'Inappropriate messages', value: 'inappropriate_behavior' },
  { label: 'Spam or scam', value: 'spam' },
  { label: "Didn't show up", value: 'no_show' },
  { label: 'Fake profile', value: 'impersonation' },
  { label: 'Other', value: 'other' },
];

export const blockUser = async (blockedId: string, reason?: string | null) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { error } = await supabase
    .from('blocked_users')
    .insert({ blocker_id: user.id, blocked_id: blockedId, reason: reason || null });
  if (error) throw error;
};

export const unblockUser = async (blockRowId: string) => {
  const { error } = await supabase.from('blocked_users').delete().eq('id', blockRowId);
  if (error) throw error;
};

export const fetchBlockedUsers = async (userId: string) => {
  const { data, error } = await supabase
    .from('blocked_users')
    .select('id, blocked_id, reason, created_at')
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = data || [];
  const cards = await fetchPublicProfileCards(rows.map((r: any) => r.blocked_id));
  const cardsById = new Map(cards.map((c: any) => [c.id, c]));

  return rows.map((row: any) => ({
    ...row,
    profiles: cardsById.get(row.blocked_id) || null,
  }));
};

export const reportUser = async (
  reportedUserId: string,
  sessionId: string | null,
  reason: string,
  details?: string | null
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    session_id: sessionId,
    reason,
    details: details || null,
    status: 'pending',
  });
  if (error) throw error;
};

export const fetchPendingReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      id, reason, details, status, created_at, session_id,
      reporter:reporter_id ( id, first_name ),
      reported:reported_user_id ( id, first_name )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const dismissReport = async (reportId: string) => {
  const { error } = await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
  if (error) throw error;
};

export type ModerationActionType = 'warning' | 'strike' | 'restriction' | 'suspension' | 'ban' | 'dismiss' | 'auto';

export const applyModerationAction = async (params: {
  reportId?: string | null;
  targetUserId: string;
  action: ModerationActionType;
  reason?: string | null;
}) => {
  const { data, error } = await supabase.rpc('apply_moderation_action', {
    p_report_id: params.reportId ?? null,
    p_target_user_id: params.targetUserId,
    p_action: params.action,
    p_reason: params.reason ?? null,
  });
  if (error) throw error;
  return data;
};

export const fetchModerationHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('moderation_events')
    .select('id, event_type, reason, created_at, expires_at, issued_by')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getUserStanding = async (userId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('get_user_standing', { p_user_id: userId });
  if (error) throw error;
  return data as string;
};

/**
 * The single most recent unexpired warning/restriction/suspension/ban for a user,
 * for display purposes (get_user_standing only returns the bare status string).
 */
export const fetchActiveModerationNotice = async (userId: string) => {
  const { data, error } = await supabase
    .from('moderation_events')
    .select('id, event_type, reason, created_at, expires_at')
    .eq('user_id', userId)
    .in('event_type', ['warning', 'restriction', 'suspension', 'ban'])
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};


// ============================================================================
// Trust & Verification
// ============================================================================

export const fetchReputationState = async (userId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('reputation_state', { p_user_id: userId });
  if (error) throw error;
  return data as string;
};

/**
 * The profile owner's own numbers + verification timestamps + reputation state.
 * Never call this for another user's id — raw numbers are owner+moderator only.
 */
export const fetchOwnTrustProfile = async (userId: string) => {
  const [{ data: row, error }, reputationState] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        first_name, total_connections, positive_signals, current_streak,
        email_verified_at, phone_verified_at, community_verified_at, id_verified_at,
        bio, interests, anonymity_level, show_verification_badges, show_reputation_state,
        default_comfort_mode, default_group_size, default_connection_mode, default_social_mood
      `)
      .eq('id', userId)
      .single(),
    fetchReputationState(userId),
  ]);
  if (error) throw error;
  return { ...row, reputation_state: reputationState };
};

export interface ProfileSettingsUpdate {
  firstName?: string;
  bio?: string | null;
  interests?: string[];
  anonymityLevel?: 'full_name' | 'first_initial';
  showVerificationBadges?: boolean;
  showReputationState?: boolean;
  defaultComfortMode?: string | null;
  defaultGroupSize?: number | null;
  defaultConnectionMode?: string | null;
  defaultSocialMood?: string | null;
}

export const updateProfileSettings = async (userId: string, updates: ProfileSettingsUpdate) => {
  const payload: Record<string, any> = {};
  if (updates.firstName !== undefined) payload.first_name = updates.firstName;
  if (updates.bio !== undefined) payload.bio = updates.bio;
  if (updates.interests !== undefined) payload.interests = updates.interests;
  if (updates.anonymityLevel !== undefined) payload.anonymity_level = updates.anonymityLevel;
  if (updates.showVerificationBadges !== undefined) payload.show_verification_badges = updates.showVerificationBadges;
  if (updates.showReputationState !== undefined) payload.show_reputation_state = updates.showReputationState;
  if (updates.defaultComfortMode !== undefined) payload.default_comfort_mode = updates.defaultComfortMode;
  if (updates.defaultGroupSize !== undefined) payload.default_group_size = updates.defaultGroupSize;
  if (updates.defaultConnectionMode !== undefined) payload.default_connection_mode = updates.defaultConnectionMode;
  if (updates.defaultSocialMood !== undefined) payload.default_social_mood = updates.defaultSocialMood;

  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) throw error;
};

/**
 * Creates (on first call for a session) or reuses an Agora call channel,
 * and mints a fresh per-user join token for it. Only ever call this from
 * the interactive "join call" action — never in a loop or on a timer.
 */
export const getOrCreateCallRoom = async (sessionId: string): Promise<{
  channel_name: string;
  app_id: string;
  uid: number;
  token: string;
}> => {
  const { data, error } = await supabase.rpc('get_or_create_call_room', { p_session_id: sessionId });
  if (error) throw error;
  return data;
};

export const submitAppeal = async (params: { moderationEventId: string; message: string }) => {
  const { data, error } = await supabase.rpc('submit_appeal', {
    p_moderation_event_id: params.moderationEventId,
    p_message: params.message,
  });
  if (error) throw error;
  return data;
};

export const fetchPendingAppeals = async () => {
  const { data, error } = await supabase
    .from('appeals')
    .select(`
      id, message, status, created_at, moderation_event_id,
      user:user_id ( id, first_name ),
      moderation_event:moderation_event_id ( event_type, reason, created_at )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const reviewAppeal = async (params: { appealId: string; uphold: boolean; resolutionNote?: string | null }) => {
  const { data, error } = await supabase.rpc('review_appeal', {
    p_appeal_id: params.appealId,
    p_uphold: params.uphold,
    p_resolution_note: params.resolutionNote ?? null,
  });
  if (error) throw error;
  return data;
};

/**
 * The only sanctioned way to look up another user's info — never raw numbers,
 * just name/avatar/reputation state/verification flags.
 */
export const fetchPublicProfileCards = async (userIds: string[]) => {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase.rpc('public_profile_cards', { p_user_ids: userIds });
  if (error) throw error;
  return data || [];
};

export const fetchPublicProfileCard = async (userId: string) => {
  const cards = await fetchPublicProfileCards([userId]);
  return cards[0] || null;
};

export type VerificationType = 'id_document' | 'community';

export const fetchMyVerificationRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, type, submission_data, status, review_note, reviewed_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const submitVerificationRequest = async (params: {
  type: VerificationType;
  note?: string | null;
  photoPath?: string | null;
}) => {
  const submissionData: Record<string, any> = {};
  if (params.note) submissionData.note = params.note;
  if (params.photoPath) submissionData.photo_path = params.photoPath;

  const { data, error } = await supabase.rpc('submit_verification_request', {
    p_type: params.type,
    p_submission_data: submissionData,
  });
  if (error) throw error;
  return data;
};

export const uploadVerificationPhoto = async (userId: string, localUri: string): Promise<string> => {
  const arrayBuffer = await fetch(localUri).then((res) => res.arrayBuffer());
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('verification-docs')
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return path;
};

export const getVerificationPhotoSignedUrl = async (path: string): Promise<string> => {
  const { data, error } = await supabase.storage.from('verification-docs').createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
};

export const fetchPendingVerificationRequests = async () => {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, type, submission_data, status, created_at, requester:user_id ( id, first_name )')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const reviewVerificationRequest = async (params: {
  requestId: string;
  approve: boolean;
  reviewNote?: string | null;
}) => {
  const { data, error } = await supabase.rpc('review_verification_request', {
    p_request_id: params.requestId,
    p_approve: params.approve,
    p_review_note: params.reviewNote ?? null,
  });
  if (error) throw error;
  return data;
};

/**
 * Real activity signals for a moderator reviewing a community-verification
 * application or a flagged periodic re-evaluation — connections, positive
 * signals, reputation tier, and recent session feedback, not just a note.
 */
export const getVerificationReviewContext = async (userId: string) => {
  const { data, error } = await supabase.rpc('get_verification_review_context', { p_user_id: userId });
  if (error) throw error;
  return data as {
    total_connections: number;
    positive_signals: number;
    reputation_state: string;
    community_verified_at: string | null;
    community_last_reviewed_at: string | null;
    recent_feedback: { signal: 'positive' | 'negative'; tags: string[]; note: string | null; created_at: string }[];
  };
};

export const fetchFlaggedReverifications = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, community_reverification_flagged_at')
    .not('community_reverification_flagged_at', 'is', null)
    .order('community_reverification_flagged_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const resolveCommunityReverification = async (params: {
  userId: string;
  revoke: boolean;
  note?: string | null;
}) => {
  const { data, error } = await supabase.rpc('resolve_community_reverification', {
    p_user_id: params.userId,
    p_revoke: params.revoke,
    p_note: params.note ?? null,
  });
  if (error) throw error;
  return data;
};

export const POSITIVE_FEEDBACK_TAGS: { label: string; value: string }[] = [
  { label: 'Great company', value: 'great_company' },
  { label: 'Showed up on time', value: 'punctual' },
  { label: 'Respectful', value: 'respectful' },
  { label: 'Good communicator', value: 'communicative' },
];

export const NEGATIVE_FEEDBACK_TAGS: { label: string; value: string }[] = [
  { label: "Didn't show up", value: 'no_show' },
  { label: 'Ran late', value: 'late' },
  { label: 'Poor communication', value: 'poor_communication' },
  { label: 'Made me uncomfortable', value: 'discomfort' },
];

export const submitSessionFeedback = async (params: {
  sessionId: string;
  ratedUserId: string;
  signal: 'positive' | 'negative';
  tags?: string[];
  note?: string | null;
}) => {
  const { data, error } = await supabase.rpc('submit_session_feedback', {
    p_session_id: params.sessionId,
    p_rated_user_id: params.ratedUserId,
    p_signal: params.signal,
    p_tags: params.tags ?? [],
    p_note: params.note ?? null,
  });
  if (error) throw error;
  return data;
};


/**
 * Handles secure insertion of chat messages into the live database table
 * with strict structural edge validation constraints.
 */
export const sendLiveMessage = async (
  sessionId: string | null, 
  userId: string | null, 
  senderName: string, 
  text: string
) => {
  if (!sessionId) {
    return;
  }

  const safeText = text?.trim();
  if (!safeText) {
    return;
  }

  if (!userId) {
    return;
  }

  try {
    const { error } = await supabase.from('messages').insert({
      session_id: sessionId,
      sender_id: userId,
      sender_name: senderName.trim() || 'You',
      message_text: safeText,
      is_system_message: false
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn('Supabase message sync unavailable; continuing in local-only mode.', error);
  }
};


export const fetchSocialProofStats = async () => {
  try {
    const { count: activeLobbies, error: countError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .in('status', OPEN_SESSION_STATUSES);

    // 💡 FIX: Change 'intent_text' to 'intent' inside this select statement
    const { data: recentTags, error: tagsError } = await supabase
      .from('sessions')
      .select('id, intent, social_mood, connection_mode, created_at')
      .in('status', OPEN_SESSION_STATUSES)
      .order('created_at', { ascending: false })
      .limit(3);

    if (countError || tagsError) throw countError || tagsError;

    // Map 'intent' back to your component UI expectations safely
    const formattedLobbies = (recentTags || []).map((item: any) => ({
      id: item.id,
      intent_text: item.intent, // Maps the correct column back to your ticker UI fields
      social_mood: item.social_mood,
      connection_mode: item.connection_mode,
    }));

    return {
      activeCount: activeLobbies || 0,
      recentLobbies: formattedLobbies
    };
  } catch (error) {
    console.error("Error gathering social momentum metrics:", error);
    return { activeCount: 0, recentLobbies: [] };
  }
};


