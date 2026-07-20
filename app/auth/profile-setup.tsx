import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, ShieldAlert, ArrowLeft } from 'lucide-react-native';
import { BRAND_COLORS } from '../../constants/Colors';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(['Daily commute', 'School runs']);

  const preferenceOptions = ['Daily commute', 'Errands', 'School runs', 'Office route'];

  const togglePreference = (pref: string) => {
    if (selectedPrefs.includes(pref)) {
      setSelectedPrefs(selectedPrefs.filter(item => item !== pref));
    } else {
      setSelectedPrefs([...selectedPrefs, pref]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {/* Navigation Arrow Header Backing Layer */}
        <TouchableOpacity style={[styles.backArrow, { top: insets.top + 20 }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={BRAND_COLORS.textDark} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Step Indicator Header Section */}
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, styles.progressActive]} />
              <View style={[styles.progressBar, styles.progressActive]} />
              <View style={[styles.progressBar, styles.progressActive]} />
            </View>
            <Text style={styles.stepText}>Step 3 of 3</Text>
          </View>

          {/* Text Presentation Content Block */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Set up your profile</Text>
            <Text style={styles.subtitle}>Help people recognize who they're coordinating with.</Text>
          </View>

          {/* Core Profile Wrapper Layout Card */}
          <View style={styles.setupCard}>
            
            {/* Interactive Camera Placeholder Frame */}
            <TouchableOpacity style={styles.avatarCircleFrame} activeOpacity={0.8}>
              <View style={styles.avatarInnerFill}>
                <Camera size={36} color={BRAND_COLORS.primaryDark} />
              </View>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Display name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Your name or handle"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
            />

            <Text style={styles.inputLabel}>Short bio</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              placeholder="Tell a little about yourself..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={bio}
              onChangeText={setBio}
            />

            {/* Travel Categorization Segment Controls */}
            <Text style={styles.preferenceSectionHeader}>Preferences</Text>
            <View style={styles.chipGridContainer}>
              {preferenceOptions.map((option) => {
                const isActive = selectedPrefs.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.baseChip, isActive ? styles.activeChip : null]}
                    onPress={() => togglePreference(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive ? styles.activeChipText : null]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Shield Notice Footnote Info */}
            <View style={styles.privacyShieldInfoRow}>
              <ShieldAlert size={18} color={BRAND_COLORS.primary} />
              <Text style={styles.privacyShieldText}>
                Only safe public details are shown before you confirm a match.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, !displayName && styles.disabledButton]} 
              onPress={() => router.replace('/(tabs)/home')}
              disabled={!displayName}
            >
              <Text style={styles.buttonText}>Save and continue</Text>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFDF9' },
  container: { flex: 1 },
  backArrow: { position: 'absolute', left: 20, zIndex: 10, padding: 8 },
  scrollContainer: { padding: 24, paddingTop: 40, alignItems: 'center' },
  header: { alignItems: 'center', width: '100%' },
  progressContainer: { flexDirection: 'row', gap: 6, marginVertical: 12, width: 140, justifyContent: 'center' },
  progressBar: { height: 4, width: 40, backgroundColor: '#E2EBE7', borderRadius: 2 },
  progressActive: { backgroundColor: BRAND_COLORS.primary },
  stepText: { fontSize: 13, fontWeight: '600', color: BRAND_COLORS.textMuted },
  titleSection: { alignItems: 'center', marginVertical: 20, paddingHorizontal: 10 },
  mainTitle: { fontSize: 26, fontWeight: '800', color: '#1B2B24', textAlign: 'center' },
  subtitle: { fontSize: 14, color: BRAND_COLORS.textMuted, textAlign: 'center', marginTop: 6 },
  setupCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, width: '100%', borderWidth: 1, borderColor: BRAND_COLORS.borderLight },
  
  // Custom design camera placeholder shape mapping wireframe
  avatarCircleFrame: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#EDF9F4', borderWidth: 2, borderColor: '#FFF', alignSelf: 'center', marginBottom: 20, justifyContent: 'center', alignItems: 'center', shadowColor: BRAND_COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  avatarInnerFill: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#CBEFDE', justifyContent: 'center', alignItems: 'center' },
  
  inputLabel: { fontSize: 14, fontWeight: '600', color: BRAND_COLORS.textDark, alignSelf: 'flex-start', marginTop: 12, marginBottom: 6 },
  textInput: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 15, color: BRAND_COLORS.textDark, width: '100%' },
  textAreaInput: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  preferenceSectionHeader: { fontSize: 14, fontWeight: '700', color: BRAND_COLORS.textDark, alignSelf: 'flex-start', marginTop: 18, marginBottom: 10 },
  chipGridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', marginBottom: 16 },
  
  // Core Selection Preferences Chips Styles matching Page 3
  baseChip: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  activeChip: { backgroundColor: BRAND_COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: BRAND_COLORS.textMuted },
  activeChipText: { color: '#FFFFFF' },
  
  privacyShieldInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14, paddingHorizontal: 4 },
  privacyShieldText: { fontSize: 12, color: BRAND_COLORS.textMuted, flex: 1, fontWeight: '500', lineHeight: 16 },
  primaryButton: { backgroundColor: BRAND_COLORS.primary, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 10 },
  disabledButton: { backgroundColor: '#D4E2DC', opacity: 0.7 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
