import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../constants/Colors';

const MOOD_CHIPS = ['Low-pressure', 'Supportive', 'Structured', 'Focused', 'Casual', 'Quiet company'];

interface Step4Props {
  value: string;
  onChange: (val: string) => void;
}

export default function Step4SessionMood({ value, onChange }: Step4Props) {
  return (
    <View style={styles.stepWrapper}>
      <Text style={styles.mainPromptText}>How do you want the space to feel?</Text>
      <Text style={styles.subPromptText}>Choose the kind of online connection you need today.</Text>
      
      {/* Dynamic Wrap Layout Grid of Social Energy Chips */}
      <View style={styles.moodChipGrid}>
        {MOOD_CHIPS.map((chip) => {
          const isActive = value === chip;
          return (
            <TouchableOpacity 
              key={chip} 
              style={[styles.moodChip, isActive && styles.activeMoodChip]} 
              onPress={() => onChange(chip)}
              activeOpacity={0.7}
            >
              <Text style={[styles.moodChipText, isActive && styles.activeMoodChipText]}>
                {chip}
              </Text>
              {isActive && (
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Informative Guidance Footnote layout block */}
      <Text style={styles.energyLabelFooter}>
        We'll use this to suggest people who match your social energy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepWrapper: { width: '100%' },
  mainPromptText: { fontSize: 22, fontWeight: '700', color: TagAlongColors.textDark, textAlign: 'center', marginBottom: 8, lineHeight: 28 },
  subPromptText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  moodChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24, paddingHorizontal: 4 },
  moodChip: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  activeMoodChip: { backgroundColor: TagAlongColors.primary, borderColor: TagAlongColors.primary },
  moodChipText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  activeMoodChipText: { color: '#FFFFFF' },
  energyLabelFooter: { fontSize: 13, color: '#64748B', textAlign: 'center', paddingHorizontal: 16, lineHeight: 18 },
});
