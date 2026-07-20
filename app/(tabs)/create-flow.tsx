import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { createSessionRecord, updateSessionRecord } from '../../config/queries';
import { supabase } from '../../config/supabase';

// Match with your exact physical files inside the components root directory
import Step1IntentForm from '../../components/Step1IntentForm';
import Step2GroupSize from '../../components/Step2GroupSize';
import Step3ComfortPreferences from '../../components/Step3ComfortPreferences';
import Step4SessionMood from '../../components/Step4SessionMood';
import Step5TimingPicker from '../../components/Step5TimingPicker';
import Step6InteractionMode from '../../components/Step6InteractionMode';

export default function CreateFlowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const editSessionId = params.editSessionId ? String(params.editSessionId) : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingEdit, setIsLoadingEdit] = useState(!!editSessionId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data State Tracker Values
  const [customIntent, setCustomIntent] = useState('');
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [comfortMode, setComfortMode] = useState<'anyone' | 'same-gender'>('anyone');
  const [specificGenders, setSpecificGenders] = useState<string[]>([]);
  const [socialEnergy, setSocialEnergy] = useState('');
  const [timing, setTiming] = useState<'now' | 'later'>('now');
  const [connectMode, setConnectMode] = useState<'chat' | 'call'>('chat');

  useEffect(() => {
    if (!editSessionId) return;

    const hydrateForEdit = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('intent, group_size, comfort_mode, social_mood, connection_mode')
        .eq('id', editSessionId)
        .maybeSingle();

      if (error || !data) {
        Alert.alert('Could not load session', 'This tag-along may no longer be editable.');
        router.replace('/(tabs)/my-tags');
        return;
      }

      setCustomIntent(data.intent || '');
      setSelectedSize(data.group_size || null);
      if (data.comfort_mode && data.comfort_mode !== 'Anyone') {
        setComfortMode('same-gender');
        setSpecificGenders(data.comfort_mode.split(', ').filter(Boolean));
      }
      setSocialEnergy(data.social_mood || '');
      // Legacy 'voice'/'meeting' sessions predate the in-app calling merge — treat as 'call'.
      setConnectMode(data.connection_mode === 'chat' ? 'chat' : 'call');
      setIsLoadingEdit(false);
    };

    hydrateForEdit();
  }, [editSessionId, router]);

  useEffect(() => {
    // Seed from the user's saved defaults (Profile > Edit Profile > Session
    // Preferences) so a new tag-along doesn't start blank every single time —
    // only for brand-new sessions, never when editing an existing one.
    if (editSessionId || !user?.id) return;

    const seedFromDefaults = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('default_comfort_mode, default_group_size, default_connection_mode, default_social_mood')
        .eq('id', user.id)
        .maybeSingle();

      if (!data) return;

      if (data.default_comfort_mode && data.default_comfort_mode !== 'Anyone') {
        setComfortMode('same-gender');
        setSpecificGenders(data.default_comfort_mode.split(', ').filter(Boolean));
      }
      if (data.default_group_size) setSelectedSize(data.default_group_size);
      if (data.default_connection_mode) setConnectMode(data.default_connection_mode === 'chat' ? 'chat' : 'call');
      if (data.default_social_mood) setSocialEnergy(data.default_social_mood);
    };

    seedFromDefaults();
  }, [editSessionId, user?.id]);

  const comfortModeText = comfortMode === 'anyone' ? 'Anyone' : specificGenders.join(', ');

  const handleNextStep = async () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    if (!user?.id) {
      Alert.alert('Session expired', 'Please log in again to host a tag-along.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editSessionId) {
        await updateSessionRecord(editSessionId, {
          intent: customIntent,
          groupSize: selectedSize || 1,
          comfortMode: comfortModeText,
        });
      } else {
        await createSessionRecord({
          hostId: user.id,
          intent: customIntent,
          groupSize: selectedSize || 1,
          comfortMode: comfortModeText,
          socialMood: socialEnergy || 'Low-pressure',
          timing,
          connectionMode: connectMode,
        });
      }
      router.replace('/(tabs)/my-tags');
    } catch (err: any) {
      Alert.alert('Publishing Failed', err.message || 'Could not save your tag-along session.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const isButtonDisabled = () => {
    if (currentStep === 1) return !customIntent.trim();
    if (currentStep === 2) return selectedSize === null;
    if (currentStep === 3) return comfortMode === 'same-gender' && specificGenders.length === 0;
    if (currentStep === 4) return !socialEnergy;
    return isSubmitting;
  };

  if (isLoadingEdit) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={TagAlongColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Breadcrumb State Controller Row */}
      <View style={styles.topNavigationRow}>
        <TouchableOpacity
          onPress={() => setCurrentStep(p => p - 1)}
          style={[styles.backButton, currentStep === 1 && { opacity: 0 }]}
          disabled={currentStep === 1}
        >
          <Ionicons name="arrow-back" size={24} color={TagAlongColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.topTitleText}>Step {currentStep} of 6</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/my-tags')} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Main Form Context Window */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && <Step1IntentForm value={customIntent} onChange={setCustomIntent} />}
        {currentStep === 2 && <Step2GroupSize value={selectedSize} onChange={setSelectedSize} />}
        {currentStep === 3 && <Step3ComfortPreferences comfortMode={comfortMode} setComfortMode={setComfortMode} specificGenders={specificGenders} setSpecificGenders={setSpecificGenders} />}
        {currentStep === 4 && <Step4SessionMood value={socialEnergy} onChange={setSocialEnergy} />}
        {currentStep === 5 && <Step5TimingPicker value={timing} onChange={setTiming} />}
        {currentStep === 6 && <Step6InteractionMode value={connectMode} onChange={setConnectMode} />}
      </ScrollView>

      {/* Sticky Bottom Form Action Processing Panel */}
      <View style={[styles.footerStickyPanel, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.primaryActionBtn, isButtonDisabled() && styles.disabledActionBtn]}
          onPress={handleNextStep}
          disabled={isButtonDisabled()}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryActionBtnText}>
              {currentStep === 6 ? (editSessionId ? 'Save changes' : 'Find matches') : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TagAlongColors.background },
  topNavigationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12 },
  backButton: { padding: 8 },
  topTitleText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },
  footerStickyPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: TagAlongColors.background, paddingHorizontal: 24, paddingVertical: 20, borderTopWidth: 1, borderColor: '#F1F5F9' },
  primaryActionBtn: { backgroundColor: '#A78BFA', borderRadius: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  disabledActionBtn: { backgroundColor: '#94A3B8', opacity: 0.6 },
  primaryActionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' }
});
