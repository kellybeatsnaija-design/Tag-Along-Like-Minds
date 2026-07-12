import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { TagAlongColors } from '../constants/Colors';

function RootLayoutNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Check if the user is currently inside the tab layout navigation tree
    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'index';

    if (!user && !inAuthGroup) {
      // Direct unauthenticated users straight to the login registration screens
      router.replace('/auth');
    } else if (user && inAuthGroup) {
      // Route logged-in users away from onboarding or login loops into the app tabs
      router.replace('/(tabs)/home');
    }
  }, [user, isLoading, segments]);

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
      <Stack.Screen name="/auth/auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="matching-pool" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNavigation />
    </AuthProvider>
  );
}
