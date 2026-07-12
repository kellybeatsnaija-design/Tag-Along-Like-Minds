import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldCheck, CheckCircle2, Hourglass, ShieldAlert } from 'lucide-react-native';
import { BRAND_COLORS } from '../constants/Colors';

interface TrustProgressCardProps {
  onStartIdCheck: () => void;
}

export default function TrustProgressCard({ onStartIdCheck }: TrustProgressCardProps) {
  return (
    <View style={styles.progressCardCanvas}>
      <Text style={styles.sectionHeaderTitle}>Trust Progress</Text>
      
      {/* 2 of 4 Steps Complete Tracking Array Indicator */}
      <View style={styles.progressTrackRow}>
        <View style={styles.trackBackground}>
          <View style={styles.trackFillActive} />
        </View>
        <Text style={styles.trackMetaText}>2 of 4 complete</Text>
      </View>

      <View style={styles.statusListContainer}>
        {/* Tier 1: Phone Matrix Status */}
        <View style={styles.statusItemRow}>
          <CheckCircle2 size={18} color={BRAND_COLORS.primary} fill={BRAND_COLORS.primaryLight} />
          <Text style={styles.statusLabelTextText}>Phone verified</Text>
        </View>

        <View style={styles.statusItemRow}>
          <CheckCircle2 size={18} color={BRAND_COLORS.primary} fill={BRAND_COLORS.primaryLight} />
          <Text style={styles.statusLabelTextText}>Community verified</Text>
        </View>

        {/* Tier 3: Biometric Document Identity Verification Check Action */}
        <View style={[styles.statusItemRow, styles.pendingBorderRow]}>
          <Hourglass size={18} color="#E65100" />
          <View style={styles.pendingTextMetaBlock}>
            <Text style={[styles.statusLabelTextText, { color: '#E65100', fontWeight: '700' }]}>
              ID verification pending
            </Text>
            <TouchableOpacity style={styles.inlineActionTriggerBtn} onPress={onStartIdCheck}>
              <Text style={styles.inlineActionTriggerBtnText}>Start ID check</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressCardCanvas: {
    backgroundColor: BRAND_COLORS.cardWhite,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.borderLight,
    marginBottom: 16,
  },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '700', color: BRAND_COLORS.textMuted, letterSpacing: 1, marginBottom: 12 },
  progressTrackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  trackBackground: { flex: 1, height: 6, backgroundColor: '#E2EBE7', borderRadius: 3, overflow: 'hidden' },
  trackFillActive: { width: '50%', height: '100%', backgroundColor: BRAND_COLORS.primary },
  trackMetaText: { fontSize: 12, fontWeight: '600', color: BRAND_COLORS.textMuted },
  statusListContainer: { gap: 12 },
  statusItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  pendingBorderRow: { backgroundColor: '#FFFDF0', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFE082' },
  pendingTextMetaBlock: { flex: 1, gap: 6 },
  statusLabelTextText: { fontSize: 14, fontWeight: '600', color: BRAND_COLORS.textDark, marginTop: 1 },
  inlineActionTriggerBtn: { backgroundColor: '#FF7A00', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, alignSelf: 'flex-start' },
  inlineActionTriggerBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});
