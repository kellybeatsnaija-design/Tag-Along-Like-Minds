import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { BRAND_COLORS } from '../constants/Colors';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}

// Inside components/SettingsRowItem.tsx: ensure your onPress prop is wired to the TouchableOpacity wrapper:
export default function SettingsRowItem({ icon, label, onPress }: SettingsRowProps) {
  return (
    <TouchableOpacity style={styles.rowContainer} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <View style={styles.iconFrame}>{icon}</View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color="#A0B2AC" />
    </TouchableOpacity>
  );
}



const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: BRAND_COLORS.cardWhite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.borderLight,
    marginBottom: 8,
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconFrame: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600', color: BRAND_COLORS.textDark },
});
