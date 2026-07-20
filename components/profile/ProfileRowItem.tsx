import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';

interface ProfileRowItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  isDestructive?: boolean;
}

export default function ProfileRowItem({ icon, label, value, onPress, isDestructive = false }: ProfileRowItemProps) {
  const iconColor = isDestructive ? '#EF4444' : TagAlongColors.primary;
  const textColor = isDestructive ? '#EF4444' : (TagAlongColors.textDark || '#1E293B');

  return (
    <TouchableOpacity style={styles.rowButton} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.leftGroup}>
        <View style={[styles.iconCircle, isDestructive && styles.destructiveBg]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={[styles.labelShared, { color: textColor }]}>{label}</Text>
      </View>
      
      <View style={styles.rightGroup}>
        {value && <Text style={styles.valueText}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAFEFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  destructiveBg: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  labelShared: {
    fontSize: 15,
    fontWeight: '600',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
