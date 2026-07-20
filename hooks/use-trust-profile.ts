import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../config/supabase';
import { fetchOwnTrustProfile } from '../config/queries';

export interface TrustProfile {
  first_name: string;
  total_connections: number;
  positive_signals: number;
  current_streak: number;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  community_verified_at: string | null;
  id_verified_at: string | null;
  reputation_state: string;
  bio: string | null;
  interests: string[];
  anonymity_level: 'full_name' | 'first_initial';
  show_verification_badges: boolean;
  show_reputation_state: boolean;
  default_comfort_mode: string | null;
  default_group_size: number | null;
  default_connection_mode: string | null;
  default_social_mood: string | null;
}

const EMPTY: TrustProfile = {
  first_name: '',
  total_connections: 0,
  positive_signals: 0,
  current_streak: 0,
  email_verified_at: null,
  phone_verified_at: null,
  community_verified_at: null,
  id_verified_at: null,
  reputation_state: 'New',
  bio: null,
  interests: [],
  anonymity_level: 'full_name',
  show_verification_badges: true,
  show_reputation_state: true,
  default_comfort_mode: null,
  default_group_size: null,
  default_connection_mode: null,
  default_social_mood: null,
};

export function useTrustProfile(userId?: string | null) {
  const [profile, setProfile] = useState<TrustProfile>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  // Unique per-mount channel topic — sharing one by userId alone caused a
  // real "callbacks after subscribe()" collision fixed earlier this session
  // (see hooks/use-user-standing.ts).
  const instanceIdRef = useRef(Math.random().toString(36).slice(2));

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(EMPTY);
      setIsLoading(false);
      return;
    }
    try {
      const data = await fetchOwnTrustProfile(userId);
      setProfile(data as TrustProfile);
    } catch (err) {
      console.error('Failed to fetch trust profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfile(EMPTY);
      setIsLoading(false);
      return;
    }

    refresh();

    const channel = supabase
      .channel(`trust:${userId}:${instanceIdRef.current}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verification_requests', filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .on(
        // reputation_state() is standing-aware (via get_user_standing), so any
        // moderation event against this user must also trigger a refetch here —
        // this is now the only hook driving the Profile screen's standing/tier
        // display, so it can't afford to miss this the way the old, now-removed
        // duplicate standing badge would have masked.
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moderation_events', filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return { ...profile, isLoading, refresh };
}
