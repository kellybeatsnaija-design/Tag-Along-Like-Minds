import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TagAlongColors } from '../../constants/Colors';

interface AuthTabsProps {
  isSignUp: boolean;
  onTabChange: (isSignUp: boolean) => void;
  disabled: boolean;
}

export default function AuthTabs({ isSignUp, onTabChange, disabled }: AuthTabsProps) {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tabButton, !isSignUp && styles.activeTabLogIn]} 
        onPress={() => onTabChange(false)}
        disabled={disabled}
      >
        <Text style={[styles.tabText, !isSignUp && styles.activeTabText]}>Log in</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tabButton, isSignUp && styles.activeTabSignUp]} 
        onPress={() => onTabChange(true)}
        disabled={disabled}
      >
        <Text style={[styles.tabText, isSignUp && styles.activeTabText]}>Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 25, padding: 4, width: '100%', marginBottom: 24 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 21 },
  activeTabLogIn: { backgroundColor: TagAlongColors.primary },
  activeTabSignUp: { backgroundColor: TagAlongColors.secondary },
  tabText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },
});
