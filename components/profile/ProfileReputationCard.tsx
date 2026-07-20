import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { getReputationMeta } from '../../constants/reputation';

interface ProfileReputationCardProps {
  totalConnections: number;
  positiveSignals: number;
  currentStreak: number;
  reputationState: string;
}

export default function ProfileReputationCard({
  totalConnections = 0,
  positiveSignals = 0,
  currentStreak = 1,
  reputationState,
}: ProfileReputationCardProps) {
  const meta = getReputationMeta(reputationState);

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.sectionTitle}>Tagship Reputation</Text>

      {/* Central Reputation Status Row */}
      <View style={styles.reputationHeaderRow}>
        <View style={[styles.badgeIconFrame, { backgroundColor: `${meta.color}22` }]}>
          <Ionicons name="medal-outline" size={22} color={meta.color} />
        </View>
        <View>
          <Text style={styles.milestoneTitleText}>{meta.label}</Text>
          <Text style={styles.milestoneSubtext}>Verified Community Standing</Text>
        </View>
      </View>

      {/* Grid Matrix of Hard Statistics */}
      <View style={styles.statsGrid}>
        
        {/* Metric A: Streaks */}
        <View style={styles.statBox}>
          <Ionicons name="flame" size={20} color="#F59E0B" />
          <Text style={styles.statValue}>{currentStreak} Days</Text>
          <Text style={styles.statLabel}>Consistency</Text>
        </View>

        {/* Metric B: Total Interactions */}
        <View style={styles.statBox}>
          <Ionicons name="checkmark-done" size={20} color={TagAlongColors.primary} />
          <Text style={styles.statValue}>{totalConnections}</Text>
          <Text style={styles.statLabel}>Tagged Along</Text>
        </View>

        {/* Metric C: Behavioral Safety Approvals */}
        <View style={styles.statBox}>
          <Ionicons name="heart" size={20} color="#EF4444" />
          <Text style={styles.statValue}>+{positiveSignals}</Text>
          <Text style={styles.statLabel}>Green Flags</Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 24, padding: 18, marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  reputationHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderBottomWidth: 1, borderColor: '#F1F5F9', paddingBottom: 14 },
  badgeIconFrame: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  milestoneTitleText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  milestoneSubtext: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 1 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  statValue: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginTop: 6, marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' }
});
