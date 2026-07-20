import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TagAlongColors } from '../../constants/Colors';

interface UniversalInputPanelProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isTyping: boolean;
  isAuthLocked: boolean;
  hasActiveIntent: boolean;
}

export default function UniversalInputPanel({
  value,
  onChangeText,
  onSubmit,
  isSubmitting,
  isTyping,
  isAuthLocked,
  hasActiveIntent,
}: UniversalInputPanelProps) {
  const isInputLocked = isSubmitting || isTyping || isAuthLocked;
  const isButtonDisabled = !value.trim() || isInputLocked;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.inputStickyFooter, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.inputLayoutContainer}>
        <TextInput
          style={[styles.universalInputArea, isInputLocked && styles.lockedInputArea]}
          placeholder={hasActiveIntent ? "Type message into your dynamic room lobby..." : "e.g., Reading a book together, quiet company..."}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          multiline
          editable={!isInputLocked}
        />
        <TouchableOpacity 
          style={[styles.arrowSubmitBtn, isButtonDisabled && styles.disabledSubmitBtn]}
          onPress={onSubmit}
          disabled={isButtonDisabled}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.safetyFooterLabel}>Your data boundaries and total anonymity are guaranteed.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inputStickyFooter: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F1F5F9' },
  inputLayoutContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 4 },
  universalInputArea: { flex: 1, fontSize: 14, color: TagAlongColors.textDark || '#1E293B', maxHeight: 85, paddingVertical: 6, fontWeight: '500' },
  lockedInputArea: { opacity: 0.6 },
  arrowSubmitBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: TagAlongColors.textDark || '#1E293B', alignItems: 'center', justifyContent: 'center' },
  disabledSubmitBtn: { backgroundColor: '#CBD5E1', opacity: 0.5 },
  safetyFooterLabel: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 10, fontWeight: '500' }
});
