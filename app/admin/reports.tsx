import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { supabase } from '../../config/supabase';
import { fetchPendingReports, dismissReport } from '../../config/queries';
import ModerationActionModal from '../../components/safety/ModerationActionModal';

export default function AdminReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchPendingReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('admin-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const handleQuickDismiss = async (reportId: string) => {
    setBusyId(reportId);
    try {
      await dismissReport(reportId);
      await load();
    } catch (err) {
      console.error('Failed to dismiss report:', err);
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.rowTextGroup}>
        <Text style={styles.rowTitle}>
          {item.reporter?.first_name || 'Someone'} → {item.reported?.first_name || 'a user'}
        </Text>
        <Text style={styles.rowReason}>{item.reason}</Text>
        {item.details && <Text style={styles.rowDetails} numberOfLines={2}>{item.details}</Text>}
        <Text style={styles.rowTime}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => handleQuickDismiss(item.id)}
          disabled={busyId === item.id}
        >
          {busyId === item.id ? <ActivityIndicator size="small" color="#64748B" /> : <Text style={styles.dismissText}>Dismiss</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.reviewButton} onPress={() => setReviewTarget(item)}>
          <Text style={styles.reviewText}>Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TagAlongColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={TagAlongColors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No pending reports.</Text>}
        />
      )}

      <ModerationActionModal
        visible={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        report={reviewTarget}
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
  row: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  rowTextGroup: { marginBottom: 12 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: TagAlongColors.textDark },
  rowReason: { fontSize: 12, fontWeight: '700', color: '#92400E', marginTop: 4 },
  rowDetails: { fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 18 },
  rowTime: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  rowActions: { flexDirection: 'row', gap: 10 },
  dismissButton: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  dismissText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  reviewButton: { flex: 1, backgroundColor: TagAlongColors.primary, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  reviewText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 14, marginTop: 40 },
});
