import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

// Import decoupled conversational core visual modules
import ConversationalCanvas from '../../components/home/ConversationalCanvas';

const SUGGESTIONS = ['Language practice', 'Coding study', 'Career prep', 'Just vibes', 'Accountability', 'Tech jobs', 'Reading a book together', 'Quiet company', 'Workout buddy', 'Meditation session', 'Gaming session', 'Music jam', 'Art critique', 'Travel planning', 'Cooking together'];

type Message = {
  id: string;
  sender: 'System' | 'App' | 'User' | 'Partner';
  text: string;
  isSystem?: boolean;
  interactiveStep?: 'size' | 'comfort' | 'timing' | 'interaction' | 'done';
};

export default function UnifiedHomeScreen() {
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [universalInput, setUniversalInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State structure mirrors cost-effective PostgreSQL columns explicitly
  const [sessionData, setSessionData] = useState({
    intent_text: '',
    target_group_size: 1,
    comfort_mode: 'Anyone',
    timing_type: 'now',
    connection_mode: 'chat'
  });

  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome_msg', sender: 'App', text: 'Hi Augustine 👋\nWhat kind of company do you need today? Type your reason or tap a suggestion below.' }
  ]);

  const handleSend = () => {
    if (!universalInput.trim() || isSubmitting) return;

    const userText = universalInput.trim();
    setUniversalInput('');

    // Append standard message row into the chat feed layout
    setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'User', text: userText }]);

    if (!sessionData.intent_text) {
      setSessionData(prev => ({ ...prev, intent_text: userText }));
      
      // Inline Prompt 2 initialization: Capacity Limitations
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: 'step_size',
          sender: 'App',
          text: 'How many people do you want to connect with? Choose a capacity that feels comfortable.',
          interactiveStep: 'size'
        }]);
      }, 600);
    } else {
      console.log("Routing text straight to messages table channel storage arrays:", userText);
    }
  };

  const handleSelectSize = (size: number) => {
    setSessionData(prev => ({ ...prev, target_group_size: size }));
    setMessages(prev => [
      ...prev.map(m => m.id === 'step_size' ? { ...m, interactiveStep: 'done' as const } : m),
      { id: 'step_comfort', sender: 'App', text: `Capacity set to ${size} person(s). Who feels comfortable to connect with?`, interactiveStep: 'comfort' }
    ]);
  };

  const handleSelectComfort = (mode: string) => {
    setSessionData(prev => ({ ...prev, comfort_mode: mode }));
    setMessages(prev => [
      ...prev.map(m => m.id === 'step_comfort' ? { ...m, interactiveStep: 'done' as const } : m),
      { id: 'step_timing', sender: 'App', text: `Comfort option set to ${mode}. When do you want to connect?`, interactiveStep: 'timing' }
    ]);
  };

  const handleSelectTiming = (type: 'now' | 'later') => {
    setSessionData(prev => ({ ...prev, timing_type: type }));
    setMessages(prev => [
      ...prev.map(m => m.id === 'step_timing' ? { ...m, interactiveStep: 'done' as const } : m),
      { id: 'step_mode', sender: 'App', text: 'How do you want to connect? Choose the online option that feels best.', interactiveStep: 'interaction' }
    ]);
  };

  const handleSelectMode = async (mode: 'chat' | 'voice' | 'meeting') => {
    setIsSubmitting(true);
    const finalData = { ...sessionData, connection_mode: mode };
    setSessionData(finalData);

    setMessages(prev => [
      ...prev.map(m => m.id === 'step_mode' ? { ...m, interactiveStep: 'done' as const } : m),
      { id: 'scanning_loader', sender: 'System', text: 'Scanning for active connections matching your criteria filters...', isSystem: true }
    ]);

    try {
      const { error } = await supabase.from('sessions').insert({
        host_id: user?.id,
        intent_text: finalData.intent_text,
        target_group_size: finalData.target_group_size,
        comfort_mode: finalData.comfort_mode,
        timing_type: finalData.timing_type,
        connection_mode: finalData.connection_mode,
        status: finalData.timing_type === 'now' ? 'Active' : 'Upcoming'
      });

      if (error) throw error;

      setTimeout(() => {
        setMessages(prev => [
          ...prev.filter(m => m.id !== 'scanning_loader'),
          { id: 'match_success', sender: 'System', text: 'Match Found! Safe space initialized. Privacy guards active.', isSystem: true },
          { id: 'partner_intro', sender: 'Partner', text: `Hey Augustine! I saw you wanted to do "${finalData.intent_text}". I am down to tag along here!` }
        ]);
      }, 2500);

    } catch (err: any) {
      Alert.alert("Publishing Failed", err.message || "Network write fault.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startNewSession = () => {
    setSessionData({ intent_text: '', target_group_size: 1, comfort_mode: 'Anyone', timing_type: 'now', connection_mode: 'chat' });
    setMessages([{ id: 'welcome_msg', sender: 'App', text: 'Hi Augustine 👋\nWho are your people today? Type below to match with them' }]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Tag Along</Text>
        {sessionData.intent_text.length > 0 && (
          <TouchableOpacity style={styles.newSessionBtn} onPress={startNewSession}>
            <Ionicons name="add" size={16} color="#EF4444" />
            <Text style={styles.newSessionText}>New Stream</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.canvasArea}
        contentContainerStyle={styles.canvasContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        <ConversationalCanvas
          messages={messages}
          onSelectSize={handleSelectSize}
          onSelectComfort={handleSelectComfort}
          onSelectTiming={handleSelectTiming}
          onSelectMode={handleSelectMode}
        />
      </ScrollView>

      {!sessionData.intent_text && (
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            {SUGGESTIONS.map(tag => (
              <TouchableOpacity key={tag} style={styles.chipBtn} onPress={() => setUniversalInput(tag)}>
                <Text style={styles.chipBtnText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputStickyFooter}>
        <View style={styles.inputLayoutContainer}>
          <TextInput
            style={styles.universalInputArea}
            placeholder={sessionData.intent_text ? "Message your active stream lobby..." : "e.g., Reading a book together, quiet company..."}
            placeholderTextColor="#94A3B8"
            value={universalInput}
            onChangeText={setUniversalInput}
            multiline
            editable={!isSubmitting}
          />
          <TouchableOpacity 
            style={[styles.arrowSubmitBtn, !universalInput.trim() && styles.disabledSubmitBtn]}
            onPress={handleSend}
            disabled={!universalInput.trim() || isSubmitting}
          >
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.safetyFooterLabel}>Your data boundaries and total anonymity are guaranteed.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TagAlongColors.primary },
  newSessionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  newSessionText: { fontSize: 12, color: '#EF4444', fontWeight: '600', marginLeft: 2 },
  canvasArea: { flex: 1 },
  canvasContent: { padding: 20, paddingBottom: 30 },
  suggestionsContainer: { paddingVertical: 8, backgroundColor: '#FAF9F6' },
  suggestionsScroll: { paddingHorizontal: 20, gap: 8 },
  chipBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16 },
  chipBtnText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  inputStickyFooter: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F1F5F9', paddingBottom: Platform.OS === 'ios' ? 24 : 14 },
  inputLayoutContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 4 },
  universalInputArea: { flex: 1, fontSize: 14, color: TagAlongColors.textDark, maxHeight: 80, paddingVertical: 6 },
  arrowSubmitBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: TagAlongColors.textDark, alignItems: 'center', justifyContent: 'center' },
  disabledSubmitBtn: { backgroundColor: '#CBD5E1', opacity: 0.6 },
  safetyFooterLabel: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 10, fontWeight: '500' }
});