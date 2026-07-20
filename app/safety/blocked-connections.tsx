import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { fetchBlockedUsers, unblockUser } from '../../config/queries';

interface BlockedRow {
  id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
  profiles: { first_name: string; avatar_color: string } | null;
}

export default function BlockedConnectionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [rows, setRows] = useState<BlockedRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await fetchBlockedUsers(user.id);
      setRows(data as unknown as BlockedRow[]);
    } catch (err) {
      console.error('Failed to load blocked users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnblock = (row: BlockedRow) => {
    Alert.alert('Unblock this person?', `You'll be able to match with ${row.profiles?.first_name || 'them'} again.`, [
      { text: 'Never mind', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          setBusyId(row.id);
          try {
            await unblockUser(row.id);
            setRows((prev) => prev.filter((r) => r.id !== row.id));
          } catch (err: any) {
            Alert.alert('Could not unblock', err.message || 'Please try again.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: BlockedRow }) => (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: item.profiles?.avatar_color || '#A78BFA' }]}>
        <Text style={styles.avatarInitial}>{(item.profiles?.first_name || '?')[0]?.toUpperCase()}</Text>
      </View>
      <View style={styles.rowTextGroup}>
        <Text style={styles.rowName}>{item.profiles?.first_name || 'Unknown user'}</Text>
        {item.reason && <Text style={styles.rowReason} numberOfLines={2}>{item.reason}</Text>}
      </View>
      <TouchableOpacity
        style={[styles.unblockButton, busyId === item.id && { opacity: 0.6 }]}
        onPress={() => handleUnblock(item)}
        disabled={busyId === item.id}
      >
        {busyId === item.id ? (
          <ActivityIndicator size="small" color={TagAlongColors.primary} />
        ) : (
          <Text style={styles.unblockButtonText}>Unblock</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TagAlongColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Connections</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={TagAlongColors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't blocked anyone.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TagAlongColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TagAlongColors.textDark },
  listContent: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarInitial: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  rowTextGroup: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '700', color: TagAlongColors.textDark },
  rowReason: { fontSize: 12, color: '#64748B', marginTop: 2 },
  unblockButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
  unblockButtonText: { fontSize: 13, fontWeight: '700', color: TagAlongColors.primary },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 14, marginTop: 40 },
});
