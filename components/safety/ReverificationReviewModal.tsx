import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { TagAlongColors } from '../../constants/Colors';
import { getVerificationReviewContext, resolveCommunityReverification } from '../../config/queries';
import ActivityReviewContext from './ActivityReviewContext';

interface FlaggedUser {
  id: string;
  first_name: string;
  community_reverification_flagged_at: string;
}

interface ReverificationReviewModalProps {
  visible: boolean;
  onClose: () => void;
  target: FlaggedUser | null;
  onActioned: () => void;
}

export default function ReverificationReviewModal({ visible, onClose, target, onActioned }: ReverificationReviewModalProps) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [activityContext, setActivityContext] = useState<Awaited<ReturnType<typeof getVerificationReviewContext>> | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState<'keep' | 'revoke' | null>(null);

  useEffect(() => {
    if (!visible || !target) {
      setNote('');
      setActivityContext(null);
      return;
    }
    setIsLoadingActivity(true);
    getVerificationReviewContext(target.id)
      .then(setActivityContext)
      .catch((err) => console.error('Failed to load activity context:', err))
      .finally(() => setIsLoadingActivity(false));
  }, [visible, target]);

  if (!target) return null;

  const handleDecision = async (revoke: boolean) => {
    setSubmittingDecision(revoke ? 'revoke' : 'keep');
    try {
      await resolveCommunityReverification({ userId: target.id, revoke, note: note.trim() || null });
      onActioned();
      onClose();
    } catch (err) {
      console.error('Failed to resolve re-evaluation:', err);
    } finally {
      setSubmittingDecision(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Re-evaluate verification</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color={TagAlongColors.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.metaLine}>{target.first_name || 'Someone'}</Text>
            <Text style={styles.flaggedBadge}>
              Flagged {new Date(target.community_reverification_flagged_at).toLocaleDateString()} — recent feedback trended negative
            </Text>

            <ActivityReviewContext isLoading={isLoadingActivity} context={activityContext} />

            <Text style={styles.sectionLabel}>Resolution note (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Explain the outcome..."
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.keepButton, !!submittingDecision && { opacity: 0.6 }]}
                onPress={() => handleDecision(false)}
                disabled={!!submittingDecision}
              >
                {submittingDecision === 'keep' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Keep verified</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.revokeButton, !!submittingDecision && { opacity: 0.6 }]}
                onPress={() => handleDecision(true)}
                disabled={!!submittingDecision}
              >
                {submittingDecision === 'revoke' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Revoke</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: TagAlongColors.textDark },
  metaLine: { fontSize: 14, color: '#475569', marginBottom: 6 },
  flaggedBadge: { fontSize: 12, fontWeight: '700', color: '#92400E', backgroundColor: '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  textInput: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, color: TagAlongColors.textDark, minHeight: 70, textAlignVertical: 'top', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  keepButton: { backgroundColor: '#137333' },
  revokeButton: { backgroundColor: '#DC2626' },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
