import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { TagAlongColors } from '../../constants/Colors';
import InlineWizardOptions from './InlineWizardOptions';

type Message = {
  id: string;
  sender: 'System' | 'App' | 'User' | 'Partner';
  text: string;
  isSystem?: boolean;
  interactiveStep?: 'size' | 'comfort' | 'gender_sub_grid' | 'mood' | 'timing' | 'calendar_picker' | 'interaction' | 'call_time_picker' | 'done';
};

interface ConversationalCanvasProps {
  messages: Message[];
  onSelectSize: (size: number) => void;
  onSelectComfort: (mode: string) => void;
  onConfirmGenders?: (genders: string[]) => void;
  onSelectMood: (mood: string) => void;
  onSelectTiming: (type: 'now' | 'later') => void;
  onConfirmTimestamp?: (finalDate: Date) => void;
  onSelectMode: (mode: 'chat' | 'call') => void;
  onConfirmCallTime?: (finalDate: Date) => void;
}

export default function ConversationalCanvas({
  messages,
  onSelectSize,
  onSelectComfort,
  onConfirmGenders,
  onSelectMood,
  onSelectTiming,
  onConfirmTimestamp,
  onSelectMode,
  onConfirmCallTime,
}: ConversationalCanvasProps) {
  return (
    <View style={styles.container}>
      {messages.map((msg) => {
        const isUser = msg.sender === 'User';
        const isSystem = msg.isSystem;

        if (isSystem) {
          return (
            <View key={msg.id} style={styles.systemCard}>
              {msg.id === 'scanning_loader' && (
                <ActivityIndicator size="small" color="#64748B" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.systemCardText}>{msg.text}</Text>
            </View>
          );
        }

        return (
          <View key={msg.id} style={[styles.bubbleWrapper, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
            <Text style={styles.senderLabelText}>{msg.sender === 'User' ? 'Me' : msg.sender}</Text>
            <View style={[styles.msgBubble, isUser ? styles.msgBubbleMe : styles.msgBubbleThem]}>
              <Text style={[styles.msgText, isUser ? styles.msgTextMe : styles.msgTextThem]}>{msg.text}</Text>
            </View>

            {/* Render sub-form configuration elements nested directly below the corresponding app chat prompt line */}
            <InlineWizardOptions
              interactiveStep={msg.interactiveStep}
              onSelectSize={onSelectSize}
              onSelectComfort={onSelectComfort}
              onConfirmGenders={onConfirmGenders}
              onSelectMood={onSelectMood}
              onSelectTiming={onSelectTiming}
              onConfirmTimestamp={onConfirmTimestamp}
              onSelectMode={onSelectMode}
              onConfirmCallTime={onConfirmCallTime}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  systemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 14, marginVertical: 8 },
  systemCardText: { fontSize: 12, color: '#64748B', fontWeight: '500', textAlign: 'center' },
  bubbleWrapper: { maxWidth: '85%', gap: 4, marginVertical: 6 },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  senderLabelText: { fontSize: 11, fontWeight: '600', color: '#94A3B8', paddingHorizontal: 4 },
  msgBubble: { borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16 },
  msgBubbleThem: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  msgBubbleMe: { backgroundColor: TagAlongColors.primary },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextThem: { color: TagAlongColors.textDark },
  msgTextMe: { color: '#FFFFFF' },
});
