import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { TagAlongColors } from '../../constants/Colors';

interface FeedbackRow {
  signal: 'positive' | 'negative';
  tags: string[];
  note: string | null;
  created_at: string;
}

interface ActivityReviewContextProps {
  isLoading: boolean;
  context: {
    total_connections: number;
    positive_signals: number;
    reputation_state: string;
    recent_feedback: FeedbackRow[];
  } | null;
}

export default function ActivityReviewContext({ isLoading, context }: ActivityReviewContextProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={TagAlongColors.primary} />
      </View>
    );
  }

  if (!context) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Activity on the platform</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{context.reputation_state}</Text>
          <Text style={styles.statLabel}>Reputation tier</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{context.total_connections}</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{context.positive_signals}</Text>
          <Text style={styles.statLabel}>Positive signals</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Recent feedback</Text>
      {context.recent_feedback.length === 0 ? (
        <Text style={styles.emptyText}>No feedback recorded yet.</Text>
      ) : (
        <View style={styles.feedbackList}>
          {context.recent_feedback.map((row, idx) => (
            <View key={idx} style={styles.feedbackRow}>
              <View style={[styles.feedbackDot, row.signal === 'positive' ? styles.dotPositive : styles.dotNegative]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.feedbackTags}>
                  {row.tags.length > 0 ? row.tags.join(', ') : (row.signal === 'positive' ? 'Positive' : 'Negative')}
                </Text>
                {row.note && <Text style={styles.feedbackNote}>{row.note}</Text>}
                <Text style={styles.feedbackDate}>{new Date(row.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  loadingBox: { paddingVertical: 20, alignItems: 'center' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 10, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '800', color: TagAlongColors.textDark },
  statLabel: { fontSize: 10.5, color: '#94A3B8', marginTop: 2, textAlign: 'center' },
  emptyText: { fontSize: 13, color: '#94A3B8' },
  feedbackList: { gap: 8 },
  feedbackRow: { flexDirection: 'row', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  feedbackDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  dotPositive: { backgroundColor: '#137333' },
  dotNegative: { backgroundColor: '#DC2626' },
  feedbackTags: { fontSize: 13, fontWeight: '700', color: TagAlongColors.textDark, textTransform: 'capitalize' },
  feedbackNote: { fontSize: 12.5, color: '#475569', marginTop: 2 },
  feedbackDate: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
});
