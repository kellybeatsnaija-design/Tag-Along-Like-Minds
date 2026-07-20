import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ban, Flag, X } from 'lucide-react-native';
import { BRAND_COLORS } from '../../constants/Colors';

interface ParticipantActionSheetProps {
  visible: boolean;
  onClose: () => void;
  targetUserName: string;
  isBlocked: boolean;
  onSelectBlock: () => void;
  onSelectReport: () => void;
  onSelectUnblock: () => void;
}

export default function ParticipantActionSheet({
  visible,
  onClose,
  targetUserName,
  isBlocked,
  onSelectBlock,
  onSelectReport,
  onSelectUnblock,
}: ParticipantActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Text style={styles.title}>{targetUserName}</Text>

          {isBlocked ? (
            <TouchableOpacity style={styles.row} onPress={onSelectUnblock}>
              <Ban size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.rowText}>Unblock</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.row} onPress={onSelectBlock}>
              <Ban size={20} color="#EF4444" />
              <Text style={[styles.rowText, { color: '#EF4444' }]}>Block</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.row} onPress={onSelectReport}>
            <Flag size={20} color={BRAND_COLORS.textDark} />
            <Text style={styles.rowText}>Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={onClose}>
            <X size={20} color="#64748B" />
            <Text style={[styles.rowText, { color: '#64748B' }]}>Cancel</Text>
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
  title: { fontSize: 15, fontWeight: '700', color: BRAND_COLORS.textMuted, marginBottom: 12, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: BRAND_COLORS.borderLight },
  rowText: { fontSize: 16, fontWeight: '600', color: BRAND_COLORS.textDark },
});
