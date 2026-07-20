import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// expo-notifications' remote push registration was removed from Expo Go on
// Android starting with SDK 53 — the package throws just from being imported
// there, so it's loaded lazily and skipped entirely in that combination.
export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) return; // simulators / Expo Go can't receive a real push token
  if (isExpoGo && Platform.OS === 'android') return;

  try {
    const Notifications = await import('expo-notifications');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return; // no EAS project configured yet

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenResponse.data;

    await supabase.from('push_tokens').upsert(
      { user_id: userId, expo_push_token: expoPushToken, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,expo_push_token' }
    );
  } catch (err) {
    console.warn('Push notification registration unavailable:', err);
  }
}
