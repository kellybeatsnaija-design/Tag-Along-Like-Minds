import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { createSessionRecord } from '../../config/queries';
import { supabase } from '../../config/supabase';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useUserStanding } from '../../hooks/use-user-standing';

// Import newly decoupled home component modules
import ConversationalCanvas from '../../components/home/ConversationalCanvas';
import DailySparkAnchor from '../../components/home/DailySparkAnchor';
import HomeHeader from '../../components/home/HomeHeader';
import SocialMomentumTicker from '../../components/home/SocialMomentumTicker';
import SuggestionsBar from '../../components/home/SuggestionsBar';
import UniversalInputPanel from '../../components/home/UniversalInputPanel';
import StandingBanner from '../../components/safety/StandingBanner';

type Message = {
  id: string;
  sender: 'System' | 'App' | 'User' | 'Partner';
  text: string;
  isSystem?: boolean;
  interactiveStep?: 'size' | 'comfort' | 'gender_sub_grid' | 'mood' | 'timing' | 'calendar_picker' | 'interaction' | 'call_time_picker' | 'done';
};

export default function UnifiedHomeScreen() {
  const { user, isLoading } = useAuth();
  const { standing, notice } = useUserStanding(user?.id);
  const scrollViewRef = useRef<ScrollView>(null);
  const [universalInput, setUniversalInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [sessionData, setSessionData] = useState({ intent_text: '', target_group_size: 1, comfort_mode: 'Anyone', social_mood: 'Low-pressure', timing_type: 'now', connection_mode: 'chat', scheduled_at: null as string | null });
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome_msg', sender: 'App', text: 'Hi Augustine 👋\nWhat kind of company do you need today? Type your reason or tap a suggestion below.' }
  ]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    const notifChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [user?.id]);

  const handleSend = async () => {
    if (!universalInput.trim() || isSubmitting || isTyping) return;
    const userText = universalInput.trim();
    setUniversalInput('');

    setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'User', text: userText }]);

    if (!sessionData.intent_text) {
      setSessionData(prev => ({ ...prev, intent_text: userText }));
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: 'step_size', sender: 'App', text: 'Got it. How many people do you want to connect with today?', interactiveStep: 'size' }]);
      }, 1200);
    }
  };

  const handleSelectSize = (size: number) => {
    setSessionData(prev => ({ ...prev, target_group_size: size }));
    setIsTyping(true);
    setMessages(prev => prev.map(m => m.id === 'step_size' ? { ...m, interactiveStep: 'done' as const } : m));
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: 'step_comfort', sender: 'App', text: `Target size capped to ${size} person. Who feels comfortable to connect with?`, interactiveStep: 'comfort' }]);
    }, 1000);
  };

  const handleSelectComfort = (mode: string) => {
    setMessages(prev => prev.map(m => m.id === 'step_comfort' ? { ...m, interactiveStep: 'done' as const } : m));
    if (mode === 'Anyone') {
      setSessionData(prev => ({ ...prev, comfort_mode: 'Anyone' }));
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: 'step_mode', sender: 'App', text: 'Comfort option set to Anyone. How do you want to connect?', interactiveStep: 'interaction' }]);
      }, 1000);
    } else {
      setMessages(prev => [...prev, { id: 'step_genders', sender: 'App', text: 'Select comfortable gender categories:', interactiveStep: 'gender_sub_grid' }]);
    }
  };

  const handleConfirmGenders = (genders: string[]) => {
    setSessionData(prev => ({ ...prev, comfort_mode: genders.join(', ') }));
    setIsTyping(true);
    setMessages(prev => prev.map(m => m.id === 'step_genders' ? { ...m, interactiveStep: 'done' as const } : m));
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: 'step_mood', sender: 'App', text: 'How do you want the space to feel today? Select a social energy:', interactiveStep: 'mood' }]);
    }, 1000);
  };

  const handleSelectMood = (selectedMood: string) => {
    setSessionData(prev => ({ ...prev, social_mood: selectedMood || 'Low-pressure' }));
    setIsTyping(true);
    setMessages(prev => prev.map(m => m.id === 'step_mood' ? { ...m, interactiveStep: 'done' as const } : m));
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: 'step_mode', sender: 'App', text: `Energy set to ${selectedMood || 'Low-pressure'}. How do you want to connect?`, interactiveStep: 'interaction' }]);
    }, 1000);
  };

  // Timing is only asked for chat mode at this point — voice/meeting collect their own
  // scheduled time as part of picking that channel, so we don't ask for a time twice.
  const handleSelectTiming = async (type: 'now' | 'later') => {
    setMessages(prev => prev.map(m => m.id === 'step_timing' ? { ...m, interactiveStep: 'done' as const } : m));
    if (type === 'now') {
      const finalData = { ...sessionData, timing_type: 'now' };
      setSessionData(finalData);
      await submitSession(finalData, 'step_timing');
    } else {
      setMessages(prev => [...prev, { id: 'step_calendar', sender: 'App', text: 'Configure your future session timestamp:', interactiveStep: 'calendar_picker' }]);
    }
  };

  const handleConfirmTimestamp = async (finalDate: Date) => {
    const finalData = { ...sessionData, timing_type: 'Scheduled', scheduled_at: finalDate.toISOString() };
    setSessionData(finalData);
    await submitSession(finalData, 'step_calendar');
  };

  const submitSession = async (finalData: typeof sessionData, doneStepId: string) => {
    if (!user?.id) {
      Alert.alert("Session Expired", "Please log in again to host a session.");
      return;
    }

    setIsSubmitting(true);
    setMessages(prev => [
      ...prev.map(m => m.id === doneStepId ? { ...m, interactiveStep: 'done' as const } : m),
      { id: `scanning_loader_${Date.now()}`, sender: 'System', text: 'Adding you to the matching queue...', isSystem: true }
    ]);

    try {
      await createSessionRecord({
        hostId: user.id,
        intent: finalData.intent_text,
        groupSize: finalData.target_group_size,
        comfortMode: finalData.comfort_mode,
        socialMood: finalData.social_mood || 'Low-pressure',
        timing: finalData.timing_type,
        connectionMode: finalData.connection_mode,
        scheduledAt: finalData.scheduled_at,
      });

      router.replace('/(tabs)/my-tags');
    } catch (err: any) {
      console.error("Session initialization crash path:", err.message);
      Alert.alert("Publishing Failed", err.message);
      setMessages(prev => prev.map(m => m.id === doneStepId ? { ...m, interactiveStep: 'interaction' as const } : m));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectMode = async (mode: 'chat' | 'call') => {
    if (!user?.id) {
      Alert.alert("Session Expired", "Please log in again to host a session.");
      return;
    }
    if (standing !== 'active') {
      Alert.alert("Action unavailable", `Your account is ${standing} and can't create new sessions right now.`);
      return;
    }

    const finalData = { ...sessionData, connection_mode: mode };
    setSessionData(finalData);
    setMessages(prev => prev.map(m => m.id === 'step_mode' ? { ...m, interactiveStep: 'done' as const } : m));

    if (mode === 'chat') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: 'step_timing', sender: 'App', text: 'When do you want to connect?', interactiveStep: 'timing' }]);
      }, 1000);
      return;
    }

    // mode === 'call' — a real in-app voice/video call, so it always needs a
    // time so both sides know when to expect it (no phone number, no link).
    setMessages(prev => [...prev, { id: 'step_call_time', sender: 'App', text: 'When should the call happen? Pick a time so you both know when to expect it.', interactiveStep: 'call_time_picker' }]);
  };

  const handleConfirmCallTime = async (finalDate: Date) => {
    const finalData = { ...sessionData, connection_mode: 'call' as const, scheduled_at: finalDate.toISOString() };
    setSessionData(finalData);
    await submitSession(finalData, 'step_call_time');
  };

  const handleQuickLaunch = async (
    intent: string,
    size: number,
    comfort: string,
    mode: 'chat' | 'call'
  ) => {
    if (!user?.id) {
      Alert.alert("Session Expired", "Please log in again to host a session.");
      return;
    }
    if (standing !== 'active') {
      Alert.alert("Action unavailable", `Your account is ${standing} and can't create new sessions right now.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await createSessionRecord({
        hostId: user.id,
        intent,
        groupSize: size,
        comfortMode: comfort,
        socialMood: sessionData.social_mood || 'Low-pressure',
        timing: 'now',
        connectionMode: mode,
      });

      router.replace('/(tabs)/my-tags');
    } catch (err: any) {
      Alert.alert("Publishing Failed", err.message || "Could not create your tag-along session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startNewSession = () => {
    setSessionData({ intent_text: '', target_group_size: 1, comfort_mode: 'Anyone', social_mood: 'Low-pressure', timing_type: 'now', connection_mode: 'chat', scheduled_at: null });
    setMessages([{ id: 'welcome_msg', sender: 'App', text: 'Hi Augustine 👋\nWhat kind of company do you need today? Type your reason or tap a suggestion below.' }]);
  };

  const hasIntent = sessionData.intent_text.length > 0;
  const isAuthLocked = isLoading || !user?.id;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <HomeHeader
        hasActiveIntent={hasIntent}
        onResetSession={startNewSession}
        unreadCount={unreadCount}
        onPressNotifications={() => router.push('/notifications')}
      />

      <StandingBanner standing={standing} notice={notice} onPressLearnMore={() => router.push('/safety/guidelines')} />

      <ScrollView ref={scrollViewRef} style={styles.canvasArea} contentContainerStyle={styles.canvasContent} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })} showsVerticalScrollIndicator={false}>
        <ConversationalCanvas messages={messages} onSelectSize={handleSelectSize} onSelectComfort={handleSelectComfort} onConfirmGenders={handleConfirmGenders} onSelectMood={handleSelectMood} onSelectTiming={handleSelectTiming} onConfirmTimestamp={handleConfirmTimestamp} onSelectMode={handleSelectMode} onConfirmCallTime={handleConfirmCallTime} />

        {!hasIntent && (
          <View style={{ width: '100%' }}>
            <DailySparkAnchor onTapSpark={(text) => setUniversalInput(text)} onQuickLaunch={handleQuickLaunch} />
          </View>
        )}

        {!hasIntent && <SocialMomentumTicker onTapSuggestion={(text) => setUniversalInput(text)} />}

        {isTyping && (
          <View style={styles.typingIndicatorRow}>
            <View style={styles.avatarMockCircle}></View>
            <View style={styles.typingBubble}><ActivityIndicator size="small" color={TagAlongColors.primary} /></View>
          </View>
        )}
      </ScrollView>

      <SuggestionsBar isVisible={!hasIntent} onSelectSuggestion={(tag) => setUniversalInput(tag)} />

      <UniversalInputPanel value={universalInput} onChangeText={setUniversalInput} onSubmit={handleSend} isSubmitting={isSubmitting} isTyping={isTyping} isAuthLocked={isAuthLocked} hasActiveIntent={hasIntent} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  canvasArea: { flex: 1 },
  canvasContent: { padding: 20, paddingBottom: 40 },
  typingIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8, alignSelf: 'flex-start' },
  avatarMockCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0F2FE' },
  typingBubble: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16 }
});
