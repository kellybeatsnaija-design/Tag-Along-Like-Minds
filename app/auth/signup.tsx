import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ShieldAlert, CheckSquare, Square } from 'lucide-react-native';
import { BRAND_COLORS } from '../../constants/Colors';

export default function SignupScreen() {
  const router = useRouter();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* Step Indicator Header Section */}
        <View style={styles.header}>
          <Text style={styles.brandLogo}>Tag Along</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, styles.progressActive]} />
            <View style={styles.progressBar} />
            <View style={styles.progressBar} />
          </View>
          <Text style={styles.stepText}>Step 1 of 3</Text>
        </View>

        {/* Text Content Block */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Create your account</Text>
          <Text style={styles.subtitle}>Join trusted people nearby and coordinate shared movement safely.</Text>
        </View>

        {/* Form Container Wrapper Card */}
        <View style={styles.formCard}>
          <View style={styles.inputWrapper}>
            <Mail size={20} color={BRAND_COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Email or phone"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={identity}
              onChangeText={setIdentity}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock size={20} color={BRAND_COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Create password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.otpModeToggle} activeOpacity={0.7}>
            <Text style={styles.otpToggleText}>Prefer OTP only? <Text style={styles.inlineLink}>Continue with code</Text></Text>
          </TouchableOpacity>

          {/* Terms Agreement Interaction Checkbox */}
          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            {agreed ? (
              <CheckSquare size={22} color={BRAND_COLORS.primary} fill={BRAND_COLORS.primaryLight} />
            ) : (
              <Square size={22} color={BRAND_COLORS.textMuted} />
            )}
            <Text style={styles.checkboxLabel}>
              I agree to the <Text style={styles.underlineLink}>Terms</Text> and <Text style={styles.underlineLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!identity || !password || !agreed) && styles.disabledButton,
            ]}
            onPress={() => router.push('/auth/verify')}
            disabled={!identity || !password || !agreed}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginRedirect}>
            <Text style={styles.loginRedirectText}>Already have an account? <Text style={styles.inlineLink}>Log in</Text></Text>
          </TouchableOpacity>
        </View>


        {/* Security Bottom Branding Note */}
        <View style={styles.safetyFooter}>
          <ShieldAlert size={18} color={BRAND_COLORS.primary} />
          <Text style={styles.safetyFooterText}>Your details help us keep the community safer.</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF9' },
  scrollContainer: { padding: 24, paddingBottom: 40, alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 40, width: '100%' },
  brandLogo: { fontSize: 28, fontWeight: 'bold', color: BRAND_COLORS.primary, fontFamily: Platform.OS === 'ios' ? 'Coho' : 'sans-serif-medium' },
  progressContainer: { flexDirection: 'row', gap: 6, marginVertical: 12, width: 140, justifyContent: 'center' },
  progressBar: { height: 4, width: 40, backgroundColor: '#E2EBE7', borderRadius: 2 },
  progressActive: { backgroundColor: BRAND_COLORS.primary },
  stepText: { fontSize: 13, fontWeight: '600', color: BRAND_COLORS.textMuted },
  titleSection: { alignItems: 'center', marginVertical: 24, paddingHorizontal: 10 },
  mainTitle: { fontSize: 26, fontWeight: '800', color: '#1B2B24', textAlign: 'center' },
  subtitle: { fontSize: 14, color: BRAND_COLORS.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, width: '100%', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, shadowColor: '#121916', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 2 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, borderRadius: 14, paddingHorizontal: 14, height: 56, marginBottom: 14 },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, color: BRAND_COLORS.textDark, height: '100%' },
  otpModeToggle: { alignSelf: 'flex-start', marginVertical: 4 },
  otpToggleText: { fontSize: 13, color: BRAND_COLORS.textMuted },
  inlineLink: { color: BRAND_COLORS.primary, fontWeight: '600' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  checkboxLabel: { fontSize: 13, color: BRAND_COLORS.textDark, flex: 1 },
  underlineLink: { color: BRAND_COLORS.primary, textDecorationLine: 'underline', fontWeight: '500' },
  primaryButton: { backgroundColor: BRAND_COLORS.primary, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: '#D4E2DC', opacity: 0.7 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loginRedirect: { alignItems: 'center', marginTop: 16 },
  loginRedirectText: { fontSize: 13, color: BRAND_COLORS.textMuted },
  safetyFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 40, paddingHorizontal: 20 },
  safetyFooterText: { fontSize: 12, color: BRAND_COLORS.textMuted, fontWeight: '500' }
});
