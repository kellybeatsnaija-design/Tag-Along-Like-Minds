import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { BRAND_COLORS } from '../../constants/Colors';
import { submitAppeal } from '../../config/queries';

interface AppealModalProps {
  visible: boolean;
  onClose: () => void;
  moderationEventId: string | null;
  onSubmitted?: () => void;
}

export default function AppealModal({ visible, onClose, moderationEventId, onSubmitted }: AppealModalProps) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!moderationEventId || !message.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitAppeal({ moderationEventId, message: message.trim() });
      setMessage('');
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not submit your appeal. Please try again.');
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
            <Text style={styles.headerTitle}>Appeal this decision</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={BRAND_COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Explain why you think this decision was wrong. A moderator will review your appeal and either uphold or overturn it.
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="Tell us what happened..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, (!message.trim() || isSubmitting) && styles.submitButtonDisabled]}
            disabled={!message.trim() || isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit appeal</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: BRAND_COLORS.textDark },
  description: { fontSize: 13.5, color: BRAND_COLORS.textMuted, lineHeight: 19, marginBottom: 14 },
  textInput: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, borderRadius: 14, padding: 14, fontSize: 14, color: BRAND_COLORS.textDark, minHeight: 110, textAlignVertical: 'top', marginBottom: 12 },
  errorText: { fontSize: 12.5, color: '#DC2626', marginBottom: 10 },
  submitButton: { backgroundColor: BRAND_COLORS.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
