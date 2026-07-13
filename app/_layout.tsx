import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { TagAlongColors } from '../constants/Colors';
import { AuthProvider, useAuth } from '../context/AuthContext';


function RootLayoutNavigation() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

useEffect(() => {
  if (isLoading) return;

  // Verify if the user is currently looking at onboarding or auth trees
  const inAuthGroup = segments[0] === 'auth' || segments[0] === 'index';

  if (!user && !inAuthGroup) {
    // 💡 CHANGE THIS: Match your stack screen name explicitly!
    router.replace('/auth'); 
  } else if (user && inAuthGroup) {
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
      <Stack.Screen name="auth/index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="matching-pool" />
      <Stack.Screen name="chat/group" />
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
