import { Stack, useRouter, useSegments } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TagAlongColors } from '../constants/Colors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
// expo-notifications' remote push support was removed from Expo Go on Android
// in SDK 53 — the package throws just from being imported there, so it's
// loaded lazily below and skipped entirely in that combination.
const pushNotificationsSupported = !(isExpoGo && Platform.OS === 'android');

// Mirrors the manual fragment-token exchange already used for the Google OAuth
// redirect in app/auth/index.tsx — Supabase's email-confirmation link redirects
// back into the app the same way (access_token/refresh_token in the fragment).
async function handleAuthDeepLink(url: string | null) {
  if (!url) return;
  const fragment = url.split('#')[1] ?? '';
  if (!fragment) return;
  const params = new URLSearchParams(fragment);
  const access = params.get('access_token');
  const refresh = params.get('refresh_token');
  if (access && refresh) {
    await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
  }
}

function RootLayoutNavigation() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const currentSegment = Array.isArray(segments) ? segments[0] : segments;
    const currentSegmentText = typeof currentSegment === 'string' ? currentSegment : '';
    const inAuthGroup = currentSegmentText === 'auth' || currentSegmentText === '';

    if (!session && !inAuthGroup) {
      router.replace('/auth');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [session, isLoading, router, segments]);

  useEffect(() => {
    // Capture the Supabase email-confirmation redirect (access_token in the URL
    // fragment) whether the app was cold-started by it or already running.
    Linking.getInitialURL().then(handleAuthDeepLink);
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleAuthDeepLink(event.url);
    });
    return () => linkingSubscription.remove();
  }, []);

  useEffect(() => {
    if (!pushNotificationsSupported) return;
    let subscription: { remove: () => void } | undefined;

    import('expo-notifications').then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Deep-link when a push notification is tapped from the background/killed state
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as { room_id?: string } | undefined;
        if (data?.room_id) {
          router.push({ pathname: '/chat/group', params: { sessionId: data.room_id } });
        } else {
          router.push('/(tabs)/my-tags');
        }
      });
    }).catch((err) => console.warn('Push notification listener unavailable:', err));

    return () => subscription?.remove();
  }, [router]);

  if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF9F6' }}>
          <ActivityIndicator size="large" color={TagAlongColors.primary} />
        </View>
      );
    }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/group" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
