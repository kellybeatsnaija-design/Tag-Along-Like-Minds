import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  // Interface Configuration and Toggle Tracking States
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Structural Processing Validation
  const handleAuthAction = () => {
    // Form verification rules
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Information", "Please enter both an email address and a password.");
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        Alert.alert("Password Mismatch", "The passwords you entered do not match.");
        return;
      }
      if (!agreeToTerms) {
        Alert.alert(
          "Policy Consent Required", 
          "Please read and agree to the community guidelines and privacy policy to create your account."
        );
        return;
      }
    }

    // Explicit login execution. The global context triggers automated home view swap.
    signIn();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Visual Identity Presentation Graphic */}
        <View style={styles.logoWrapper}>
          <View style={[styles.bubbleMock, { backgroundColor: TagAlongColors.primary, left: 10 }]} />
          <View style={[styles.bubbleMock, { backgroundColor: TagAlongColors.secondary, right: 10 }]} />
        </View>

        {/* Primary Screen Headers */}
        <Text style={styles.title}>Welcome to Tag Along</Text>
        <Text style={styles.subtitle}>Find like-minded people for safe online check-ins.</Text>

        {/* Segmented Auth Control Tab Interface */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, !isSignUp && styles.activeTabLogIn]} 
            onPress={() => setIsSignUp(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, !isSignUp && styles.activeTabText]}>Log in</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, isSignUp && styles.activeTabSignUp]} 
            onPress={() => setIsSignUp(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, isSignUp && styles.activeTabText]}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Email Entry Form Groupings */}
        <View style={styles.formContainer}>
          <TextInput 
            style={styles.inputField} 
            placeholder="Email address"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput 
            style={styles.inputField} 
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
          />
          {isSignUp && (
            <TextInput 
              style={styles.inputField} 
              placeholder="Confirm password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          )}

          {/* Mandatory Safety Regulation Consent Box Block */}
          {isSignUp && (
            <View style={styles.checkboxRow}>
              <Checkbox
                style={styles.checkbox}
                value={agreeToTerms}
                onValueChange={setAgreeToTerms}
                color={agreeToTerms ? TagAlongColors.primary : '#CBD5E1'}
              />
              <Text style={styles.checkboxLabel}>
                I agree to the <Text style={styles.linkText}>community guidelines</Text> and <Text style={styles.linkText}>privacy policy</Text>.
              </Text>
            </View>
          )}

          {/* Core Action Submission Target Button */}
          <TouchableOpacity 
            style={[styles.primaryActionButton, (!isSignUp || agreeToTerms) ? {} : styles.disabledActionButton]} 
            onPress={handleAuthAction}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isSignUp ? 'Create account' : 'Log in'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fast Action Inline Toggle Link */}
        <TouchableOpacity 
          onPress={() => setIsSignUp(!isSignUp)} 
          style={styles.toggleModeWrapper}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleModeText}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Text style={{ color: TagAlongColors.secondary, fontWeight: '700' }}>
              {isSignUp ? 'Log in' : 'Sign up'}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Visual Content Splitter Line */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* OAuth Provider Interaction Deck */}
        <View style={styles.oauthSection}>
          <TouchableOpacity style={styles.oauthButton} onPress={handleAuthAction} activeOpacity={0.7}>
            <Ionicons name="logo-google" size={18} color="#EA4335" style={styles.oauthIcon} />
            <Text style={styles.oauthButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.oauthButton} onPress={handleAuthAction} activeOpacity={0.7}>
            <Ionicons name="logo-apple" size={18} color="#000000" style={styles.oauthIcon} />
            <Text style={styles.oauthButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.oauthButton} onPress={handleAuthAction} activeOpacity={0.7}>
            <Ionicons name="logo-windows" size={18} color="#00A4EF" style={styles.oauthIcon} />
            <Text style={styles.oauthButtonText}>Continue with Microsoft</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Validation Grounding Accent */}
        <Text style={styles.footerSafetyText}>Your comfort and privacy come first.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: TagAlongColors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 50,
    alignItems: 'center',
  },
  logoWrapper: {
    width: 100,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  bubbleMock: {
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'absolute',
    opacity: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 25,
    padding: 4,
    width: '100%',
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 21,
  },
  activeTabLogIn: {
    backgroundColor: TagAlongColors.primary,
  },
  activeTabSignUp: {
    backgroundColor: TagAlongColors.secondary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  formContainer: {
    width: '100%',
    gap: 14,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: TagAlongColors.textDark,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    paddingRight: 8,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
    borderRadius: 6,
    height: 20,
    width: 20,
    borderWidth: 1,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    flex: 1,
  },
  linkText: {
    color: TagAlongColors.primary,
    fontWeight: '600',
  },
  primaryActionButton: {
    backgroundColor: TagAlongColors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: TagAlongColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  disabledActionButton: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },  
  toggleModeWrapper: {
    marginTop: 22,
  },
  toggleModeText: {
    fontSize: 14,
    color: '#64748B',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 26,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 14,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  oauthSection: {
    width: '100%',
    gap: 12,
  },
  oauthButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthIcon: {
    position: 'absolute',
    left: 20,
  },
  oauthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TagAlongColors.textDark,
  },
  footerSafetyText: {
    marginTop: 40,
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
  },
});


