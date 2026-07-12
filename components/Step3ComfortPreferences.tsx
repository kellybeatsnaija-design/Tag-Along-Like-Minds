import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../constants/Colors';

const GENDER_OPTIONS = [
  { id: 'women', label: 'Women', icon: 'female-outline' },
  { id: 'men', label: 'Men', icon: 'male-outline' },
  { id: 'non-binary', label: 'Non-binary', icon: 'transgender-outline' },
];

interface Step3Props {
  comfortMode: 'anyone' | 'same-gender';
  setComfortMode: (mode: 'anyone' | 'same-gender') => void;
  specificGenders: string[];
  setSpecificGenders: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function Step3ComfortPreferences({ 
  comfortMode, 
  setComfortMode, 
  specificGenders, 
  setSpecificGenders 
}: Step3Props) {
  
  const toggleGenderSelection = (genderId: string) => {
    setSpecificGenders(prev => 
      prev.includes(genderId) ? prev.filter(id => id !== genderId) : [...prev, genderId]
    );
  };

  return (
    <View style={styles.stepWrapper}>
      <Text style={styles.mainPromptText}>Who feels comfortable to connect with?</Text>
      <Text style={styles.subPromptText}>Your preferences help us suggest safer, more suitable online matches.</Text>
      
      {/* Macro Preference Switch Row */}
      <View style={styles.comfortToggleContainer}>
        <TouchableOpacity 
          style={[styles.comfortToggleBtn, comfortMode === 'anyone' && styles.comfortActiveBtn]} 
          onPress={() => setComfortMode('anyone')}
        >
          <Text style={[styles.comfortToggleBtnText, comfortMode === 'anyone' && styles.comfortActiveBtnText]}>
            Anyone
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.comfortToggleBtn, comfortMode === 'same-gender' && styles.comfortActiveBtnSecondary]} 
          onPress={() => setComfortMode('same-gender')}
        >
          {comfortMode === 'same-gender' && (
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          )}
          <Text style={[styles.comfortToggleBtnText, comfortMode === 'same-gender' && styles.comfortActiveBtnText]}>
            Gender-specific
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-grid of demographic selection options */}
      {comfortMode === 'same-gender' && (
        <View style={styles.genderSubGrid}>
          {GENDER_OPTIONS.map((gender) => {
            const isChecked = specificGenders.includes(gender.id);
            return (
              <TouchableOpacity 
                key={gender.id} 
                style={[styles.genderCard, isChecked && styles.activeGenderCard]} 
                onPress={() => toggleGenderSelection(gender.id)}
              >
                <Ionicons name={gender.icon as any} size={24} color={isChecked ? TagAlongColors.primary : '#64748B'} />
                <Text style={styles.genderCardText}>{gender.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Trust Guidance Footer Callout Block */}
      <View style={styles.reassuranceCalloutBox}>
        <Ionicons name="information-circle-outline" size={18} color="#64748B" style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={styles.calloutText}>
          You can change this anytime. We only use this to guide matching.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepWrapper: { width: '100%' },
  mainPromptText: { fontSize: 22, fontWeight: '700', color: TagAlongColors.textDark, textAlign: 'center', marginBottom: 8, lineHeight: 28 },
  subPromptText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  comfortToggleContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  comfortToggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 16, flexDirection: 'row' },
  comfortActiveBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  comfortActiveBtnSecondary: { backgroundColor: TagAlongColors.primary },
  comfortToggleBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  comfortActiveBtnText: { color: TagAlongColors.textDark },
  genderSubGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  genderCard: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 16, height: 90, alignItems: 'center', justifyContent: 'center', gap: 6 },
  activeGenderCard: { borderColor: TagAlongColors.primary },
  genderCardText: { fontSize: 13, fontWeight: '600', color: TagAlongColors.textDark },
  reassuranceCalloutBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 },
  calloutText: { fontSize: 13, color: '#64748B', flex: 1, lineHeight: 18 },
});
