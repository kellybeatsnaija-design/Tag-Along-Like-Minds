import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../config/supabase';
import { getUserStanding, fetchActiveModerationNotice } from '../config/queries';

export interface ModerationNotice {
  id: string;
  event_type: string;
  reason: string | null;
  created_at: string;
  expires_at: string | null;
}

export function useUserStanding(userId?: string | null) {
  const [standing, setStanding] = useState<string>('active');
  const [notice, setNotice] = useState<ModerationNotice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Each mounted usage of this hook (e.g. Home and Profile watching the same
  // user simultaneously) needs its own realtime channel topic — sharing one
  // by userId alone causes a "callbacks after subscribe()" collision.
  const instanceIdRef = useRef(Math.random().toString(36).slice(2));

  const refresh = useCallback(async () => {
    if (!userId) {
      setStanding('active');
      setNotice(null);
      setIsLoading(false);
      return;
    }
    try {
      const [standingResult, noticeResult] = await Promise.all([
        getUserStanding(userId),
        fetchActiveModerationNotice(userId),
      ]);
      setStanding(standingResult || 'active');
      setNotice(noticeResult as ModerationNotice | null);
    } catch (err) {
      console.error('Failed to fetch user standing:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setStanding('active');
      setNotice(null);
      setIsLoading(false);
      return;
    }

    refresh();

    const channel = supabase
      .channel(`standing:${userId}:${instanceIdRef.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moderation_events', filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return { standing, notice, isLoading, refresh };
}
