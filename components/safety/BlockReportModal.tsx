import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { BRAND_COLORS } from '../../constants/Colors';
import { REPORT_REASONS, blockUser, reportUser } from '../../config/queries';

interface BlockReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  sessionId: string | null;
  initialTab: 'block' | 'report';
  onBlocked?: () => void;
  onReported?: () => void;
}

export default function BlockReportModal({
  visible,
  onClose,
  targetUserId,
  targetUserName,
  sessionId,
  initialTab,
  onBlocked,
  onReported,
}: BlockReportModalProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'block' | 'report'>(initialTab);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      setSelectedChip(null);
      setReasonText('');
    }
  }, [visible, initialTab]);

  const handleChipPress = (chip: { label: string; value: string }) => {
    setSelectedChip(chip.value);
    if (chip.value !== 'other') setReasonText(chip.label);
    else setReasonText('');
  };

  const canSubmitReport = !!selectedChip && (selectedChip !== 'other' || reasonText.trim().length > 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (activeTab === 'block') {
        await blockUser(targetUserId, reasonText.trim() || null);
        onClose();
        onBlocked?.();
      } else {
        await reportUser(targetUserId, sessionId, selectedChip || 'other', reasonText.trim() || null);
        onClose();
        onReported?.();
      }
    } catch (err: any) {
      // Surfacing inline rather than a separate Alert keeps the sheet open on failure
      setReasonText((prev) => prev);
      console.error('Block/report submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{targetUserName}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={BRAND_COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'block' && styles.tabButtonActive]}
              onPress={() => setActiveTab('block')}
            >
              <Text style={[styles.tabText, activeTab === 'block' && styles.tabTextActive]}>Block</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'report' && styles.tabButtonActive]}
              onPress={() => setActiveTab('report')}
            >
              <Text style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}>Report</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>
            {activeTab === 'block' ? 'Reason (optional)' : 'What happened?'}
          </Text>
          <View style={styles.chipRow}>
            {REPORT_REASONS.map((chip) => (
              <TouchableOpacity
                key={chip.value}
                style={[styles.chip, selectedChip === chip.value && styles.chipActive]}
                onPress={() => handleChipPress(chip)}
              >
                <Text style={[styles.chipText, selectedChip === chip.value && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textInput}
            placeholder={activeTab === 'block' ? 'Add a note (optional)' : 'Add details (optional unless "Other")'}
            placeholderTextColor="#999"
            value={reasonText}
            onChangeText={setReasonText}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              activeTab === 'block' ? styles.submitButtonDestructive : styles.submitButtonPrimary,
              (activeTab === 'report' && !canSubmitReport) && styles.submitButtonDisabled,
            ]}
            disabled={isSubmitting || (activeTab === 'report' && !canSubmitReport)}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {activeTab === 'block' ? `Block ${targetUserName}` : 'Submit report'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: BRAND_COLORS.cardWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: BRAND_COLORS.textDark },
  tabRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 18 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabButtonActive: { backgroundColor: BRAND_COLORS.cardWhite },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  tabTextActive: { color: BRAND_COLORS.textDark },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: BRAND_COLORS.textMuted, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: BRAND_COLORS.primaryLight, borderColor: BRAND_COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: BRAND_COLORS.primaryDark },
  textInput: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, borderRadius: 14, padding: 14, fontSize: 14, color: BRAND_COLORS.textDark, minHeight: 80, textAlignVertical: 'top', marginBottom: 18 },
  submitButton: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  submitButtonPrimary: { backgroundColor: BRAND_COLORS.primary },
  submitButtonDestructive: { backgroundColor: '#EF4444' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
