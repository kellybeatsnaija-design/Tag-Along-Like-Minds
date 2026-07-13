import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';

interface GoogleButtonProps {
  onPress: () => void;
  disabled: boolean;
}

export default function GoogleButton({ onPress, disabled }: GoogleButtonProps) {
  return (
    <TouchableOpacity 
      style={styles.googleButton} 
      onPress={onPress} 
      disabled={disabled} 
      activeOpacity={0.8}
    >
      <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 12 }} />
      <Text style={styles.googleButtonText}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  googleButtonText: { fontSize: 15, fontWeight: '600', color: TagAlongColors.textDark }
});
