import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { supabase } from '../../config/supabase';
import { fetchPendingVerificationRequests } from '../../config/queries';
import VerificationReviewModal from '../../components/safety/VerificationReviewModal';

export default function AdminVerificationsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchPendingVerificationRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load verification requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('admin-verifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_requests' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.rowTextGroup}>
        <Text style={styles.rowTitle}>{item.requester?.first_name || 'Someone'}</Text>
        <Text style={styles.rowType}>{item.type === 'id_document' ? 'ID Verification' : 'Community Verification'}</Text>
        <Text style={styles.rowTime}>{new Date(item.created_at).toLocaleString()}</Text>
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
        <Text style={styles.headerTitle}>Verification Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={TagAlongColors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No pending verification requests.</Text>}
        />
      )}

      <VerificationReviewModal
        visible={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        request={reviewTarget}
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
  rowType: { fontSize: 12, fontWeight: '700', color: '#92400E', marginTop: 4 },
  rowTime: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  reviewButton: { backgroundColor: TagAlongColors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  reviewText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 14, marginTop: 40 },
});
