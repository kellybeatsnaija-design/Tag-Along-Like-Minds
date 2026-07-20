import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  data: { session_id?: string; room_id?: string };
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setNotifications(data as NotificationRow[]);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();

    const channel = supabase
      .channel(`notifications-feed:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications(prev => [payload.new as NotificationRow, ...prev])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadNotifications]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  const handlePressRow = async (row: NotificationRow) => {
    setNotifications(prev => prev.map(n => n.id === row.id ? { ...n, read: true } : n));
    supabase.from('notifications').update({ read: true }).eq('id', row.id).then(() => {});

    const roomId = row.data?.room_id;
    if (roomId && (row.type === 'match_joined' || row.type === 'group_ready')) {
      router.push({ pathname: '/chat/group', params: { sessionId: roomId } });
    } else {
      router.push('/(tabs)/my-tags');
    }
  };

  const renderItem = ({ item }: { item: NotificationRow }) => (
    <TouchableOpacity style={styles.row} onPress={() => handlePressRow(item)} activeOpacity={0.7}>
      {!item.read && <View style={styles.unreadDot} />}
      <View style={styles.rowTextGroup}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowBody}>{item.body}</Text>
        <Text style={styles.rowTime}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TagAlongColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={TagAlongColors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TagAlongColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TagAlongColors.textDark },
  markAllText: { fontSize: 13, fontWeight: '600', color: TagAlongColors.primary },
  listContent: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 10, marginTop: 6 },
  rowTextGroup: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: TagAlongColors.textDark, marginBottom: 2 },
  rowBody: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  rowTime: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 14, marginTop: 40 },
});
