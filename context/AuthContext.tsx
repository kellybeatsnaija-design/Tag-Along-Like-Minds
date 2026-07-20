import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { registerForPushNotificationsAsync } from '../hooks/use-push-registration';

type AuthContextType = {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  isModerator: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function ensureProfileExists(activeUser: any) {
  if (!activeUser?.id) return;
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', activeUser.id)
      .maybeSingle();

    if (!existingProfile) {
      const fallbackName = activeUser.email ? activeUser.email.split('@')[0] : 'New User';
      const { error: insertError } = await supabase.from('profiles').insert({
        id: activeUser.id,
        first_name: fallbackName,
        avatar_color: '#3F979B',
      });
      if (insertError) throw insertError;
    }
  } catch (err) {
    console.error('Failed to self-heal profile row:', err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const refreshModeratorFlag = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('is_moderator').eq('id', userId).maybeSingle();
      if (isMounted) setIsModerator(!!data?.is_moderator);
    };

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (initialSession?.user) await ensureProfileExists(initialSession.user);
        if (!isMounted) return;
        setSession(initialSession ?? null);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          registerForPushNotificationsAsync(initialSession.user.id).catch((err) =>
            console.error('Failed to register for push notifications:', err)
          );
          refreshModeratorFlag(initialSession.user.id).catch((err) =>
            console.error('Failed to check moderator status:', err)
          );
        } else {
          setIsModerator(false);
        }
      } catch (err) {
        console.error('Failed to restore Supabase session:', err);
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        setIsModerator(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      (async () => {
        if (!isMounted) return;
        if (nextSession?.user) await ensureProfileExists(nextSession.user);
        if (!isMounted) return;
        setSession(nextSession ?? null);
        setUser(nextSession?.user ?? null);
        setIsLoading(false);
        if (nextSession?.user) {
          registerForPushNotificationsAsync(nextSession.user.id).catch((err) =>
            console.error('Failed to register for push notifications:', err)
          );
          refreshModeratorFlag(nextSession.user.id).catch((err) =>
            console.error('Failed to check moderator status:', err)
          );
        } else {
          setIsModerator(false);
        }
      })();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setUser(null);
      setIsModerator(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isModerator, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be wrapped within an AuthProvider component');
  }
  return context;
}
