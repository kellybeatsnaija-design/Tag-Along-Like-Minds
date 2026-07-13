import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TagAlongColors } from '../../constants/Colors';

interface InlineWizardOptionsProps {
  interactiveStep: 'size' | 'comfort' | 'timing' | 'interaction' | 'done' | undefined;
  onSelectSize: (size: number) => void;
  onSelectComfort: (mode: string) => void;
  onSelectTiming: (type: 'now' | 'later') => void;
  onSelectMode: (mode: 'chat' | 'voice' | 'meeting') => void;
}

export default function InlineWizardOptions({
  interactiveStep,
  onSelectSize,
  onSelectComfort,
  onSelectTiming,
  onSelectMode,
}: InlineWizardOptionsProps) {
  if (!interactiveStep || interactiveStep === 'done') return null;

  return (
    <View style={styles.container}>
      {/* 👥 CAPACITY BUTTONS ELEMENT */}
      {interactiveStep === 'size' && (
        <View style={styles.optionsRow}>
          {[1, 2, 3, 4].map(num => (
            <TouchableOpacity key={num} style={styles.optionBtn} onPress={() => onSelectSize(num)}>
              <Text style={styles.optionBtnText}>{num} Person{num > 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 🛡️ PRIVACY COMFORT OPTIONS ELEMENT */}
      {interactiveStep === 'comfort' && (
        <View style={styles.optionsRow}>
          {['Anyone', 'Gender-specific'].map(mode => (
            <TouchableOpacity key={mode} style={styles.optionBtn} onPress={() => onSelectComfort(mode)}>
              <Text style={styles.optionBtnText}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ⏰ TIMING PICKER ELEMENT */}
      {interactiveStep === 'timing' && (
        <View style={styles.optionsRow}>
          <TouchableOpacity style={styles.optionBtn} onPress={() => onSelectTiming('now')}>
            <Text style={styles.optionBtnText}>Right now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBtn} onPress={() => onSelectTiming('later')}>
            <Text style={styles.optionBtnText}>Later</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🎥 COMMUNICATION MODES VERTICAL STACK ELEMENT */}
      {interactiveStep === 'interaction' && (
        <View style={styles.verticalStack}>
          <TouchableOpacity style={styles.stackBtn} onPress={() => onSelectMode('chat')}>
            <Text style={styles.optionBtnText}>💬 Chat only</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stackBtn} onPress={() => onSelectMode('voice')}>
            <Text style={styles.optionBtnText}>📞 Voice call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stackBtn} onPress={() => onSelectMode('meeting')}>
            <Text style={styles.optionBtnText}>🎥 Online meeting</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, width: '100%' },
  optionsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', width: '100%' },
  verticalStack: { gap: 6, width: 220 },
  optionBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: TagAlongColors.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  stackBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: TagAlongColors.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, width: '100%' },
  optionBtnText: { color: TagAlongColors.primary, fontSize: 13, fontWeight: '600' },
});
