import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { BRAND_COLORS } from '../../constants/Colors';

export default function VerifyScreen() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(45);
  const inputsRef = useRef<TextInput[]>([]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleChangeText = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text.slice(-1); // Only allow one character per box
    setCode(newCode);

    // Automatically advance focus to the next square input container
    if (text && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Drop focus backward if backspace is tapped inside empty containers
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const isComplete = code.every(val => val !== '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {/* Step Indicator Header Section */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, styles.progressActive]} />
            <View style={[styles.progressBar, styles.progressActive]} />
            <View style={styles.progressBar} />
          </View>
          <Text style={styles.stepText}>Step 2 of 3</Text>
        </View>

        {/* Text Presentation Content Block */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Verify your account</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code we sent to your phone or email.</Text>
        </View>

        {/* Structured 6-Digit Grid Wrap Card */}
        <View style={styles.verifyCard}>
          <View style={styles.codeRowContainer}>
            {Array(6).fill(0).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => { if (ref) inputsRef.current[index] = ref; }}
                style={[styles.codeBoxInput, code[index] ? styles.codeBoxFilled : null]}
                keyboardType="number-pad"
                maxLength={1}
                value={code[index]}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                textAlign="center"
              />
            ))}
          </View>

          <Text style={styles.timerText}>
            Resend code in <Text style={styles.timerHighlight}>00:{timer.toString().padStart(2, '0')}</Text>
          </Text>

          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Need help?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryButton, !isComplete && styles.disabledButton]} 
            onPress={() => router.push('/auth/community-setup')}
            disabled={!isComplete}
          >
            <Text style={styles.buttonText}>Verify and continue</Text>
          </TouchableOpacity>


          {/* <TouchableOpacity 
            style={[styles.primaryButton, !isComplete && styles.disabledButton]} 
            onPress={() => router.push('/auth/community-setup')} // Updates to community discovery layout page!
            disabled={!isComplete}
          >
            <Text style={styles.buttonText}>Verify and continue</Text>
          </TouchableOpacity> */}


        </View>

        {/* Security Bottom Note */}
        <View style={styles.safetyFooter}>
          <ShieldAlert size={18} color={BRAND_COLORS.primary} />
          <Text style={styles.safetyFooterText}>Verification helps keep Tag Along safer for everyone.</Text>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFDF9' },
  container: { flex: 1, padding: 24, alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 20, width: '100%' },
  progressContainer: { flexDirection: 'row', gap: 6, marginVertical: 12, width: 140, justifyContent: 'center' },
  progressBar: { height: 4, width: 40, backgroundColor: '#E2EBE7', borderRadius: 2 },
  progressActive: { backgroundColor: BRAND_COLORS.primary },
  stepText: { fontSize: 13, fontWeight: '600', color: BRAND_COLORS.textMuted },
  titleSection: { alignItems: 'center', marginVertical: 24, paddingHorizontal: 10 },
  mainTitle: { fontSize: 26, fontWeight: '800', color: '#1B2B24', textAlign: 'center' },
  subtitle: { fontSize: 14, color: BRAND_COLORS.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  verifyCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, alignItems: 'center' },
  codeRowContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 6, marginBottom: 20 },
  codeBoxInput: { flex: 1, height: 56, backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, borderRadius: 12, fontSize: 20, fontWeight: 'bold', color: BRAND_COLORS.textDark },
  codeBoxFilled: { borderColor: BRAND_COLORS.primary, backgroundColor: '#FFF' },
  timerText: { fontSize: 14, color: BRAND_COLORS.textMuted, fontWeight: '500' },
  timerHighlight: { color: '#E65100', fontWeight: '700' },
  helpButton: { marginVertical: 14 },
  helpButtonText: { color: BRAND_COLORS.primary, fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' },
  primaryButton: { backgroundColor: BRAND_COLORS.primary, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 6 },
  disabledButton: { backgroundColor: '#D4E2DC', opacity: 0.7 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  safetyFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 'auto', marginBottom: 20 },
  safetyFooterText: { fontSize: 12, color: BRAND_COLORS.textMuted, fontWeight: '500' }
});
