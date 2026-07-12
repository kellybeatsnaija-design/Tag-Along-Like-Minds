import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../constants/Colors';

interface Step6Props {
  value: 'chat' | 'voice' | 'meeting';
  onChange: (val: 'chat' | 'voice' | 'meeting') => void;
}

export default function Step6InteractionMode({ value, onChange }: Step6Props) {
  return (
    <View style={styles.stepWrapper}>
      <Text style={styles.mainPromptText}>How do you want to connect?</Text>
      <Text style={styles.subPromptText}>Choose the online option that feels most comfortable.</Text>
      
      {/* Interaction Mode Selection Stack */}
      <View style={styles.modeStack}>
        {/* Chat Only Selection Card row */}
        <TouchableOpacity 
          style={[styles.modeListRow, value === 'chat' && styles.activeModeListRow]} 
          onPress={() => onChange('chat')}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles-outline" size={24} color={value === 'chat' ? '#FFFFFF' : TagAlongColors.primary} />
          <Text style={[styles.modeListText, value === 'chat' && styles.activeModeText]}>
            Chat only
          </Text>
        </TouchableOpacity>
        
        {/* Voice Call Selection Card row */}
        <TouchableOpacity 
          style={[styles.modeListRow, value === 'voice' && styles.activeModeListRow]} 
          onPress={() => onChange('voice')}
          activeOpacity={0.8}
        >
          <Ionicons name="call-outline" size={24} color={value === 'voice' ? '#FFFFFF' : TagAlongColors.primary} />
          <Text style={[styles.modeListText, value === 'voice' && styles.activeModeText]}>
            Voice call
          </Text>
        </TouchableOpacity>
        
        {/* Online Third Party Video Meeting Selection Card row */}
        <TouchableOpacity 
          style={[styles.modeListRow, value === 'meeting' && styles.activeModeListRow]} 
          onPress={() => onChange('meeting')}
          activeOpacity={0.8}
        >
          <Ionicons name="videocam-outline" size={24} color={value === 'meeting' ? '#FFFFFF' : TagAlongColors.primary} />
          <View style={styles.meetingTextContainer}>
            <Text style={[styles.modeListText, value === 'meeting' && styles.activeModeText]}>
              Online meeting
            </Text>
            <Text style={[styles.modeListSubText, value === 'meeting' && styles.activeModeText]}>
              Teams, Google Meet, or Zoom-style session
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Trust & Boundary Assertion Safety Card Block */}
      <View style={styles.safetyCardBlock}>
        <Ionicons name="shield-checkmark" size={20} color="#6D28D9" style={styles.safetyIcon} />
        <View style={styles.safetyTextGroup}>
          <Text style={styles.safetyCardBlockText}>You control what you share.</Text>
          <Text style={styles.safetyCardBlockText}>You can leave anytime.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepWrapper: { width: '100%' },
  mainPromptText: { fontSize: 22, fontWeight: '700', color: TagAlongColors.textDark, textAlign: 'center', marginBottom: 8, lineHeight: 28 },
  subPromptText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  modeStack: { gap: 12, marginBottom: 24 },
  modeListRow: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  activeModeListRow: { backgroundColor: TagAlongColors.primary, borderColor: TagAlongColors.primary },
  meetingTextContainer: { flex: 1 },
  modeListText: { fontSize: 16, fontWeight: '700', color: TagAlongColors.textDark },
  modeListSubText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  activeModeText: { color: '#FFFFFF' },
  safetyCardBlock: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', padding: 16, borderRadius: 16 },
  safetyIcon: { marginRight: 12 },
  safetyTextGroup: { flex: 1 },
  safetyCardBlockText: { fontSize: 13, color: '#6D28D9', fontWeight: '500', lineHeight: 18 },
});
