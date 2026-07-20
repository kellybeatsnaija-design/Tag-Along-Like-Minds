import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MailCheck, ShieldAlert } from 'lucide-react-native';
import { BRAND_COLORS } from '../../constants/Colors';
import { supabase } from '../../config/supabase';

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email ? String(params.email) : '';

  const [cooldown, setCooldown] = useState(45);
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setCooldown(45);
    } catch (err: any) {
      console.error('Failed to resend confirmation email:', err.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleAlreadyConfirmed = async () => {
    setIsChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth');
      }
      // If a session exists, the root layout's auth-state redirect already
      // takes over and moves us to /(tabs)/home — nothing more to do here.
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <MailCheck size={32} color={BRAND_COLORS.primary} />
        </View>

        <Text style={styles.mainTitle}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a confirmation link to{'\n'}
          <Text style={styles.emailText}>{email || 'your email'}</Text>.{'\n'}
          Tap it, then come back here.
        </Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.resendButton, cooldown > 0 && styles.disabledButton]}
            onPress={handleResend}
            disabled={cooldown > 0 || isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {cooldown > 0 ? `Resend in 00:${cooldown.toString().padStart(2, '0')}` : 'Resend email'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleAlreadyConfirmed} style={styles.continueButton} disabled={isChecking}>
            {isChecking ? (
              <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
            ) : (
              <Text style={styles.continueButtonText}>Already confirmed? Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.safetyFooter}>
          <ShieldAlert size={18} color={BRAND_COLORS.primary} />
          <Text style={styles.safetyFooterText}>Verification helps keep Tag Along safer for everyone.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFDF9' },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: BRAND_COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  mainTitle: { fontSize: 26, fontWeight: '800', color: '#1B2B24', textAlign: 'center' },
  subtitle: { fontSize: 14, color: BRAND_COLORS.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  emailText: { fontWeight: '700', color: BRAND_COLORS.textDark },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, alignItems: 'center', marginTop: 32 },
  resendButton: { backgroundColor: BRAND_COLORS.primary, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', width: '100%' },
  disabledButton: { backgroundColor: '#D4E2DC', opacity: 0.7 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  continueButton: { marginTop: 18 },
  continueButtonText: { color: BRAND_COLORS.primary, fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' },
  safetyFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 40 },
  safetyFooterText: { fontSize: 12, color: BRAND_COLORS.textMuted, fontWeight: '500' }
});
