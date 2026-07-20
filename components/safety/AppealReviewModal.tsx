import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { TagAlongColors } from '../../constants/Colors';
import { reviewAppeal } from '../../config/queries';

interface AppealSummary {
  id: string;
  message: string;
  created_at: string;
  moderation_event_id: string;
  user: { id: string; first_name: string } | null;
  moderation_event: { event_type: string; reason: string | null; created_at: string } | null;
}

interface AppealReviewModalProps {
  visible: boolean;
  onClose: () => void;
  appeal: AppealSummary | null;
  onActioned: () => void;
}

export default function AppealReviewModal({ visible, onClose, appeal, onActioned }: AppealReviewModalProps) {
  const insets = useSafeAreaInsets();
  const [resolutionNote, setResolutionNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState<'uphold' | 'overturn' | null>(null);

  useEffect(() => {
    if (visible) setResolutionNote('');
  }, [visible, appeal?.id]);

  if (!appeal) return null;

  const handleDecision = async (uphold: boolean) => {
    setSubmittingDecision(uphold ? 'uphold' : 'overturn');
    try {
      await reviewAppeal({ appealId: appeal.id, uphold, resolutionNote: resolutionNote.trim() || null });
      onActioned();
      onClose();
    } catch (err) {
      console.error('Failed to review appeal:', err);
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
              <Text style={styles.headerTitle}>Review appeal</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color={TagAlongColors.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.metaLine}>{appeal.user?.first_name || 'Someone'}</Text>
            {appeal.moderation_event && (
              <Text style={styles.originalDecisionBadge}>
                Original decision: {appeal.moderation_event.event_type}
                {appeal.moderation_event.reason ? ` — ${appeal.moderation_event.reason}` : ''}
              </Text>
            )}

            <Text style={styles.sectionLabel}>Their appeal</Text>
            <Text style={styles.messageText}>{appeal.message}</Text>

            <Text style={styles.sectionLabel}>Resolution note (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Explain the outcome..."
              placeholderTextColor="#999"
              value={resolutionNote}
              onChangeText={setResolutionNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.upholdButton, !!submittingDecision && { opacity: 0.6 }]}
                onPress={() => handleDecision(true)}
                disabled={!!submittingDecision}
              >
                {submittingDecision === 'uphold' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Uphold</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.overturnButton, !!submittingDecision && { opacity: 0.6 }]}
                onPress={() => handleDecision(false)}
                disabled={!!submittingDecision}
              >
                {submittingDecision === 'overturn' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Overturn</Text>
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
  originalDecisionBadge: { fontSize: 12, fontWeight: '700', color: '#92400E', backgroundColor: '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  messageText: { fontSize: 14, color: '#475569', lineHeight: 20, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 16 },
  textInput: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, color: TagAlongColors.textDark, minHeight: 70, textAlignVertical: 'top', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  upholdButton: { backgroundColor: '#64748B' },
  overturnButton: { backgroundColor: '#137333' },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
