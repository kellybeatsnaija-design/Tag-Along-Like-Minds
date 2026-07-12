import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';

// Match with your exact physical files inside the components root directory
import Step1IntentForm from '../../components/Step1IntentForm';
import Step2GroupSize from '../../components/Step2GroupSize';
import Step3ComfortPreferences from '../../components/Step3ComfortPreferences';
import Step4SessionMood from '../../components/Step4SessionMood';
import Step5TimingPicker from '../../components/Step5TimingPicker';
import Step6InteractionMode from '../../components/Step6InteractionMode';

export default function CreateFlowScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Data State Tracker Values
  const [customIntent, setCustomIntent] = useState('');
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [comfortMode, setComfortMode] = useState<'anyone' | 'same-gender'>('anyone');
  const [specificGenders, setSpecificGenders] = useState<string[]>([]);
  const [socialEnergy, setSocialEnergy] = useState('');
  const [timing, setTiming] = useState<'now' | 'later'>('now');
  const [connectMode, setConnectMode] = useState<'chat' | 'voice' | 'meeting'>('chat');

  const handleNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    } else {
      console.log('Publishing decoupled payload data:', { customIntent, selectedSize, comfortMode, specificGenders, socialEnergy, timing, connectMode });
      
      // CHANGE THIS: Push the session straight to your new animated matchmaking radar screen!
      router.push('/matching-pool');
    }
  };


  const isButtonDisabled = () => {
    if (currentStep === 1) return !customIntent.trim();
    if (currentStep === 2) return selectedSize === null;
    if (currentStep === 3) return comfortMode === 'same-gender' && specificGenders.length === 0;
    if (currentStep === 4) return !socialEnergy;
    return false;
  };

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
      <View style={styles.footerStickyPanel}>
        <TouchableOpacity 
          style={[styles.primaryActionBtn, isButtonDisabled() && styles.disabledActionBtn]}
          onPress={handleNextStep}
          disabled={isButtonDisabled()}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryActionBtnText}>
            {currentStep === 6 ? 'Find matches' : 'Continue'}
          </Text>
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
