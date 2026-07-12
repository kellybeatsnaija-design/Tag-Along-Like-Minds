import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../constants/Colors';

const GROUP_SIZES = [
  { id: 1, label: '1 person', icon: 'person-outline' },
  { id: 2, label: '2 people', icon: 'people-outline' },
  { id: 3, label: '3 people', icon: 'people-outline' },
  { id: 4, label: '4 people', icon: 'people-outline' },
];

interface Step2Props {
  value: number | null;
  onChange: (val: number) => void;
}

export default function Step2GroupSize({ value, onChange }: Step2Props) {
  return (
    <View style={styles.stepWrapper}>
      <Text style={styles.mainPromptText}>How many people do you want to connect with?</Text>
      <Text style={styles.subPromptText}>Choose a capacity that feels comfortable for your mood today.</Text>
      
      {/* Horizontal Selection Ribbon */}
      <View style={styles.horizontalRowContainer}>
        {GROUP_SIZES.map((item) => {
          const isActive = value === item.id;
          return (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.sizeSquareCard, isActive && styles.activeSizeCard]} 
              onPress={() => onChange(item.id)} 
              activeOpacity={0.8}
            >
              <Ionicons name={item.icon as any} size={26} color={isActive ? '#FFFFFF' : TagAlongColors.primary} />
              <Text style={[styles.sizeCardText, isActive && styles.activeSizeCardText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grounding Context Reassurance Callout Card Box */}
      <View style={styles.reassuranceCalloutBox}>
        <Ionicons name="information-circle-outline" size={18} color="#64748B" style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={styles.calloutText}>
          Keeping streams bounded to small groups minimizes social friction and maintains a low-pressure environment.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepWrapper: { width: '100%' },
  mainPromptText: { fontSize: 22, fontWeight: '700', color: TagAlongColors.textDark, textAlign: 'center', marginBottom: 8, lineHeight: 28 },
  subPromptText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  horizontalRowContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 24 },
  sizeSquareCard: { backgroundColor: TagAlongColors.cardBg, borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 16, flex: 1, height: 85, alignItems: 'center', justifyContent: 'center' },
  activeSizeCard: { backgroundColor: TagAlongColors.primary, borderColor: TagAlongColors.primary },
  sizeCardText: { fontSize: 12, fontWeight: '600', color: TagAlongColors.textDark, marginTop: 6 },
  activeSizeCardText: { color: '#FFFFFF' },
  reassuranceCalloutBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 },
  calloutText: { fontSize: 13, color: '#64748B', flex: 1, lineHeight: 18 },
});
