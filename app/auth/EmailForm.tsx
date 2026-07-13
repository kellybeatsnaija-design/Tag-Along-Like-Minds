import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Checkbox from 'expo-checkbox';
import { TagAlongColors } from '../../constants/Colors';

interface EmailFormProps {
  isSignUp: boolean;
  isProcessing: boolean;
  onSubmit: (email: string, password: string) => void;
}

export default function EmailForm({ isSignUp, isProcessing, onSubmit }: EmailFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = () => {
    if (isSignUp && password !== confirmPassword) {
      alert("The passwords entered do not match.");
      return;
    }
    onSubmit(email, password);
  };

  const isButtonDisabled = !email.trim() || !password.trim() || (isSignUp && !agreeToTerms) || isProcessing;

  return (
    <View style={styles.formContainer}>
      <TextInput 
        style={styles.inputField} 
        placeholder="Email address"
        placeholderTextColor="#94A3B8"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        editable={!isProcessing}
      />
      <TextInput 
        style={styles.inputField} 
        placeholder="Password"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        editable={!isProcessing}
      />
      {isSignUp && (
        <TextInput 
          style={styles.inputField} 
          placeholder="Confirm password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          autoCapitalize="none"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isProcessing}
        />
      )}

      {isSignUp && (
        <View style={styles.checkboxRow}>
          <Checkbox
            style={styles.checkbox}
            value={agreeToTerms}
            onValueChange={setAgreeToTerms}
            color={agreeToTerms ? TagAlongColors.primary : '#CBD5E1'}
            disabled={isProcessing}
          />
          <Text style={styles.checkboxLabel}>
            I agree to the <Text style={styles.linkText}>community guidelines</Text> and <Text style={styles.linkText}>privacy policy</Text>.
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.primaryActionButton, isButtonDisabled && styles.disabledActionButton]} 
        onPress={handleSubmit}
        disabled={isButtonDisabled}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {isSignUp ? 'Create account' : 'Log in'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: { width: '100%', gap: 14 },
  inputField: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, color: TagAlongColors.textDark },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4, paddingRight: 8 },
  checkbox: { marginRight: 12, marginTop: 2, borderRadius: 6, height: 20, width: 20 },
  checkboxLabel: { fontSize: 13, color: '#64748B', lineHeight: 18, flex: 1 },
  linkText: { color: TagAlongColors.primary, fontWeight: '600' },
  primaryActionButton: { backgroundColor: TagAlongColors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  disabledActionButton: { backgroundColor: '#94A3B8', opacity: 0.6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' }
});
