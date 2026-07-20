import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, isLoading, isModerator } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || !isModerator) {
      router.replace('/(tabs)/profile');
    }
  }, [user, isLoading, isModerator, router]);

  if (isLoading || !user || !isModerator) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={TagAlongColors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: TagAlongColors.background },
});
