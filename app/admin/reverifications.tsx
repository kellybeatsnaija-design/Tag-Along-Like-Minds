import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { supabase } from '../../config/supabase';
import { fetchFlaggedReverifications } from '../../config/queries';
import ReverificationReviewModal from '../../components/safety/ReverificationReviewModal';

export default function AdminReverificationsScreen() {
  const router = useRouter();
  const [flagged, setFlagged] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchFlaggedReverifications();
      setFlagged(data);
    } catch (err) {
      console.error('Failed to load flagged re-evaluations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('admin-reverifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.rowTextGroup}>
        <Text style={styles.rowTitle}>{item.first_name || 'Someone'}</Text>
        <Text style={styles.rowTime}>Flagged {new Date(item.community_reverification_flagged_at).toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.reviewButton} onPress={() => setReviewTarget(item)}>
        <Text style={styles.reviewText}>Review</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TagAlongColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Re-evaluations</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={TagAlongColors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={flagged}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No community verifications flagged for re-evaluation.</Text>}
        />
      )}

      <ReverificationReviewModal
        visible={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        target={reviewTarget}
        onActioned={load}
      />
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
  rowTextGroup: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: TagAlongColors.textDark },
  rowTime: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  reviewButton: { backgroundColor: TagAlongColors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  reviewText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 14, marginTop: 40 },
});
