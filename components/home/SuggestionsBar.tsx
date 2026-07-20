import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

const SUGGESTIONS = ['Language practice', 'Coding study', 'Career prep', 'Just vibes', 'Accountability'];

interface SuggestionsBarProps {
  isVisible: boolean;
  onSelectSuggestion: (tag: string) => void;
}

export default function SuggestionsBar({ isVisible, onSelectSuggestion }: SuggestionsBarProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.suggestionsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
        {SUGGESTIONS.map(tag => (
          <TouchableOpacity key={tag} style={styles.chipBtn} onPress={() => onSelectSuggestion(tag)} activeOpacity={0.7}>
            <Text style={styles.chipBtnText}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  suggestionsContainer: { paddingVertical: 10, backgroundColor: '#FAF9F6', borderTopWidth: 1, borderColor: '#F1F5F9' },
  suggestionsScroll: { paddingHorizontal: 20, gap: 8 },
  chipBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  chipBtnText: { fontSize: 13, color: '#475569', fontWeight: '600' },
});
