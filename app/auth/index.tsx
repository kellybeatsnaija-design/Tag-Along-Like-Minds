import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, TouchableOpacity, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { TagAlongColors } from '../../constants/Colors';
import { supabase } from '../../config/supabase';

// Import decoupled items
import AuthTabs from './AuthTabs';
import EmailForm from './EmailForm';
import GoogleButton from './GoogleButton';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEmailAuthentication = async (email: string, password: string) => {
    setIsProcessing(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password: password.trim() });
        if (error) throw error;
        Alert.alert("Verify Email", "We sent an activation link to your inbox.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
        if (error) throw error;
      }
    } catch (err: any) {
      Alert.alert("Auth Error", err.message || "An error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleAuthentication = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'myapp://home', skipBrowserRedirect: true },
      });
      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'myapp://home');
        if (result.type === 'success' && result.url) {
          const params = new URL(result.url).searchParams;
          const access = params.get('access_token');
          const refresh = params.get('refresh_token');
          if (access && refresh) await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
        }
      }
    } catch (err: any) {
      Alert.alert("Google Login Error", err.message || "Could not link account.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrapper}>
          <View style={[styles.bubbleMock, { backgroundColor: TagAlongColors.primary, left: 10 }]} />
          <View style={[styles.bubbleMock, { backgroundColor: TagAlongColors.secondary, right: 10 }]} />
        </View>

        <Text style={styles.title}>Welcome to Tag Along</Text>
        <Text style={styles.subtitle}>Find like-minded people for safe online check-ins.</Text>

        <AuthTabs isSignUp={isSignUp} onTabChange={setIsSignUp} disabled={isProcessing} />
        
        <EmailForm isSignUp={isSignUp} isProcessing={isProcessing} onSubmit={handleEmailAuthentication} />

        <TouchableOpacity onPress={() => !isProcessing && setIsSignUp(!isSignUp)} style={styles.toggleModeWrapper}>
          <Text style={styles.toggleModeText}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Text style={{ color: TagAlongColors.secondary, fontWeight: '700' }}>{isSignUp ? 'Log in' : 'Sign up'}</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} />
        </View>

        <GoogleButton onPress={handleGoogleAuthentication} disabled={isProcessing} />

        <Text style={styles.footerSafetyText}>Your comfort and privacy come first.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: TagAlongColors.background },
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 32, paddingTop: 80, paddingBottom: 50, alignItems: 'center' },
  logoWrapper: { width: 100, height: 60, flexDirection: 'row', justifyContent: 'center', position: 'relative', marginBottom: 20 },
  bubbleMock: { width: 50, height: 50, borderRadius: 25, position: 'absolute', opacity: 0.8 },
  title: { fontSize: 24, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 32, paddingHorizontal: 8, lineHeight: 20 },
  toggleModeWrapper: { marginTop: 22 },
  toggleModeText: { fontSize: 14, color: '#64748B' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 14, color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  footerSafetyText: { marginTop: 40, fontSize: 13, fontWeight: '500', color: '#94A3B8', textAlign: 'center' }
});
