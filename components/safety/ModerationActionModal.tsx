import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { TagAlongColors } from '../../constants/Colors';
import { fetchModerationHistory, applyModerationAction, ModerationActionType } from '../../config/queries';

interface ReportSummary {
  id: string;
  reason: string;
  details: string | null;
  session_id: string | null;
  reporter: { id: string; first_name: string } | null;
  reported: { id: string; first_name: string } | null;
}

interface ModerationActionModalProps {
  visible: boolean;
  onClose: () => void;
  report: ReportSummary | null;
  onActioned: () => void;
}

const ACTIONS: { label: string; value: ModerationActionType; color: string }[] = [
  { label: 'Warning', value: 'warning', color: '#F59E0B' },
  { label: '24h Restriction', value: 'restriction', color: '#F97316' },
  { label: '7-day Suspension', value: 'suspension', color: '#DC2626' },
  { label: 'Permanent Ban', value: 'ban', color: '#991B1B' },
];

export default function ModerationActionModal({ visible, onClose, report, onActioned }: ModerationActionModalProps) {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  useEffect(() => {
    if (visible && report?.reported?.id) {
      setReasonText('');
      setIsLoadingHistory(true);
      fetchModerationHistory(report.reported.id)
        .then(setHistory)
        .catch((err) => console.error('Failed to load moderation history:', err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [visible, report?.reported?.id]);

  if (!report) return null;

  const priorViolations = history.filter((h) =>
    ['warning', 'strike', 'restriction', 'suspension', 'ban'].includes(h.event_type)
  ).length;

  const handleDismiss = async () => {
    setSubmittingAction('dismiss');
    try {
      await applyModerationAction({ reportId: report.id, targetUserId: report.reported?.id || '', action: 'dismiss', reason: reasonText || null });
      onActioned();
      onClose();
    } catch (err) {
      console.error('Failed to dismiss report:', err);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleAction = async (action: ModerationActionType) => {
    if (!reasonText.trim()) return;
    setSubmittingAction(action);
    try {
      await applyModerationAction({ reportId: report.id, targetUserId: report.reported?.id || '', action, reason: reasonText.trim() });
      onActioned();
      onClose();
    } catch (err) {
      console.error('Failed to apply moderation action:', err);
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Review report</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color={TagAlongColors.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.metaLine}>
              {report.reporter?.first_name || 'Someone'} reported {report.reported?.first_name || 'a user'}
            </Text>
            <Text style={styles.reasonBadge}>{report.reason}</Text>
            {report.details && <Text style={styles.detailsText}>{report.details}</Text>}

            <View style={styles.historyBox}>
              {isLoadingHistory ? (
                <ActivityIndicator size="small" color={TagAlongColors.primary} />
              ) : (
                <>
                  <Text style={styles.historyTitle}>
                    {priorViolations} prior confirmed violation{priorViolations === 1 ? '' : 's'}
                  </Text>
                  {history.slice(0, 5).map((h) => (
                    <Text key={h.id} style={styles.historyRow}>
                      • {h.event_type} — {new Date(h.created_at).toLocaleDateString()}
                    </Text>
                  ))}
                </>
              )}
            </View>

            <Text style={styles.sectionLabel}>Reason (required for any action)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Explain the decision..."
              placeholderTextColor="#999"
              value={reasonText}
              onChangeText={setReasonText}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.dismissButton, submittingAction === 'dismiss' && { opacity: 0.6 }]}
              onPress={handleDismiss}
              disabled={!!submittingAction}
            >
              {submittingAction === 'dismiss' ? (
                <ActivityIndicator size="small" color={TagAlongColors.textDark} />
              ) : (
                <Text style={styles.dismissButtonText}>Dismiss report</Text>
              )}
            </TouchableOpacity>

            <View style={styles.actionGrid}>
              {ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.value}
                  style={[
                    styles.actionButton,
                    { backgroundColor: action.color },
                    (!reasonText.trim() || !!submittingAction) && styles.actionButtonDisabled,
                  ]}
                  disabled={!reasonText.trim() || !!submittingAction}
                  onPress={() => handleAction(action.value)}
                >
                  {submittingAction === action.value ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>{action.label}</Text>
                  )}
                </TouchableOpacity>
              ))}
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
  metaLine: { fontSize: 14, color: '#475569', marginBottom: 8 },
  reasonBadge: { alignSelf: 'flex-start', backgroundColor: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 8 },
  detailsText: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 14 },
  historyBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 16 },
  historyTitle: { fontSize: 13, fontWeight: '700', color: TagAlongColors.textDark, marginBottom: 4 },
  historyRow: { fontSize: 12, color: '#64748B', marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  textInput: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, color: TagAlongColors.textDark, minHeight: 70, textAlignVertical: 'top', marginBottom: 16 },
  dismissButton: { borderRadius: 14, paddingVertical: 13, alignItems: 'center', backgroundColor: '#F1F5F9', marginBottom: 12 },
  dismissButtonText: { fontSize: 14, fontWeight: '700', color: TagAlongColors.textDark },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: { flexBasis: '48%', borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  actionButtonDisabled: { opacity: 0.4 },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
