import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { BRAND_COLORS } from '../../constants/Colors';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'group';
}

export default function GroupChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [inputText, setInputText] = useState('');

  const participants = useMemo(() => {
    const raw = String(params.participants || '');
    return raw ? raw.split(',').map(item => item.trim()).filter(Boolean) : [];
  }, [params.participants]);

  const origin = params.origin ? String(params.origin) : 'Unknown origin';
  const destination = params.destination ? String(params.destination) : 'Unknown destination';
  const intentTag = params.intentTag ? String(params.intentTag) : 'Shared ride';
  const groupSize = params.groupSize ? Number(params.groupSize) : 1;

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: `Group created for ${origin} → ${destination}.`, sender: 'group' },
    { id: '2', text: 'Welcome! This chat includes everyone in your confirmed group match.', sender: 'group' },
  ]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: inputText.trim(), sender: 'me' }]);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.sender === 'me' ? styles.myBubble : styles.groupBubble]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#111" size={24} />
          </TouchableOpacity>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>Group Coordination</Text>
            <Text style={styles.headerSubtitle}>{participants.length} participants • {intentTag}</Text>
          </View>
        </View>

        <View style={styles.groupDetailsSection}>
          <Text style={styles.groupDetailsTitle}>Group details</Text>
          <View style={styles.groupDetailRow}>
            <Text style={styles.groupDetailLabel}>Route</Text>
            <Text style={styles.groupDetailText}>{origin} → {destination}</Text>
          </View>
          <View style={styles.groupDetailRow}>
            <Text style={styles.groupDetailLabel}>Intent</Text>
            <Text style={styles.groupDetailText}>{intentTag}</Text>
          </View>
          <View style={styles.groupDetailRow}>
            <Text style={styles.groupDetailLabel}>Requested size</Text>
            <Text style={styles.groupDetailText}>{groupSize} {groupSize === 1 ? 'person' : 'people'}</Text>
          </View>
          <View style={styles.participantHeaderRow}>
            <Text style={styles.groupDetailLabel}>Participants</Text>
            <Text style={styles.participantCountText}>{participants.length} joined</Text>
          </View>
          <View style={styles.participantListRow}>
            {participants.length > 0 ? participants.map((name) => (
              <View key={name} style={styles.participantPill}>
                <Text style={styles.participantPillText}>{name}</Text>
              </View>
            )) : (
              <Text style={styles.noParticipantsText}>No participants yet</Text>
            )}
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message the group..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Send color="#FFF" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BRAND_COLORS.bgCanvas },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: BRAND_COLORS.borderLight, backgroundColor: BRAND_COLORS.cardWhite, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  backButton: { marginRight: 16 },
  headerTextWrapper: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BRAND_COLORS.textDark },
  headerSubtitle: { fontSize: 12, color: BRAND_COLORS.textMuted, marginTop: 2 },
  groupDetailsSection: { backgroundColor: BRAND_COLORS.primaryLight, borderRadius: 20, padding: 18, margin: 16, borderWidth: 1, borderColor: BRAND_COLORS.borderLight },
  groupDetailsTitle: { fontSize: 16, fontWeight: '800', color: BRAND_COLORS.textDark, marginBottom: 12 },
  groupDetailRow: { marginBottom: 10 },
  groupDetailLabel: { fontSize: 12, fontWeight: '700', color: BRAND_COLORS.textMuted, marginBottom: 4 },
  groupDetailText: { fontSize: 14, fontWeight: '600', color: BRAND_COLORS.textDark },
  participantHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  participantCountText: { fontSize: 12, fontWeight: '700', color: BRAND_COLORS.primary },
  participantListRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  participantPill: { backgroundColor: BRAND_COLORS.cardWhite, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: BRAND_COLORS.borderLight, marginBottom: 8 },
  participantPillText: { fontSize: 13, fontWeight: '700', color: BRAND_COLORS.textDark },
  noParticipantsText: { fontSize: 13, color: BRAND_COLORS.textMuted },
  messageList: { paddingHorizontal: 16, paddingBottom: 16 },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 18, marginBottom: 10 },
  groupBubble: { backgroundColor: BRAND_COLORS.primaryLight, alignSelf: 'flex-start' },
  myBubble: { backgroundColor: BRAND_COLORS.primary, alignSelf: 'flex-end' },
  messageText: { color: '#111', fontSize: 15, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: BRAND_COLORS.cardWhite, borderTopWidth: 1, borderTopColor: BRAND_COLORS.borderLight, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginRight: 12, color: BRAND_COLORS.textDark },
  sendButton: { backgroundColor: BRAND_COLORS.primary, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }
});
