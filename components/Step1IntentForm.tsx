import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../constants/Colors';

const { width } = Dimensions.get('window');

const INTENT_OPTIONS = [
  { id: 'language', label: 'Language practice', icon: 'chatbubbles-outline', color: '#3F979B' },
  { id: 'coding', label: 'Coding study', icon: 'code-slash-outline', color: '#6366F1' },
  { id: 'career', label: 'Career prep', icon: 'briefcase-outline', color: '#F59E0B' },
  { id: 'accountability', label: 'Accountability', icon: 'checkbox-outline', color: '#10B981' },
  { id: 'interests', label: 'Shared interests', icon: 'heart-outline', color: '#EC4899' },
  { id: 'vibes', label: 'Just vibes', icon: 'musical-notes-outline', color: '#A78BFA' },
];

interface Step1Props {
  value: string;
  onChange: (val: string) => void;
}

export default function Step1IntentForm({ value, onChange }: Step1Props) {
  return (
    <View style={styles.stepWrapper}>
      <Text style={styles.mainPromptText}>Who are your people?</Text>
      {/* <Text style={styles.subPromptText}>Type your reason or tap a suggestion below to autofill.</Text> */}
      
      {/* Functional Text Box for Type-in Capacity */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.customTextInput}
          placeholder="e.g., Reading a book together, quiet companion..."
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChange}
          maxLength={50}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChange('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionLabelText}>Suggestions</Text>

      {/* Suggestion Card Autofill Grid */}
      <View style={styles.gridContainer}>
        {INTENT_OPTIONS.map((item) => {
          const isMatching = value.toLowerCase().trim() === item.label.toLowerCase();
          return (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.intentCard, isMatching && styles.activeIntentCard]} 
              onPress={() => onChange(item.label)} 
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircleMock, { backgroundColor: isMatching ? item.color : '#F8FAFC' }]}>
                <Ionicons name={item.icon as any} size={24} color={isMatching ? '#FFFFFF' : item.color} />
              </View>
              <Text style={[styles.cardLabelText, isMatching && styles.activeCardLabelText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepWrapper: { width: '100%' },
  mainPromptText: { fontSize: 22, fontWeight: '700', color: TagAlongColors.textDark, textAlign: 'center', marginBottom: 8, lineHeight: 28 },
  subPromptText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 24 },
  customTextInput: { flex: 1, fontSize: 15, color: TagAlongColors.textDark, fontWeight: '500' },
  clearButton: { padding: 4 },
  sectionLabelText: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  intentCard: { backgroundColor: TagAlongColors.cardBg, borderRadius: 20, width: (width - 60) / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E2E8F0', height: 110, padding: 8 },
  activeIntentCard: { borderColor: TagAlongColors.primary, elevation: 2 },
  iconCircleMock: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cardLabelText: { fontSize: 13, fontWeight: '600', color: '#475569', textAlign: 'center' },
  activeCardLabelText: { color: TagAlongColors.textDark },
});
