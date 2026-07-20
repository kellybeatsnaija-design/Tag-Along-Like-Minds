import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, DollarSign } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  isProposal?: boolean;
  amount?: number;
  proposalStatus?: 'pending' | 'accepted' | 'declined';
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  
  // Local state initialized with a mock peer-to-peer negotiation sequence
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hey! Saw you are heading to Victoria Island from Ajah around 8:00 AM too.", sender: 'them' },
    { id: '2', text: "Yes! Planning to take an e-hailing ride or a verified corporate shuttle depending on what we agree.", sender: 'me' },
    { id: '3', text: "Awesome, let's split the cost. I can propose the split amount here.", sender: 'them' },
    { id: '4', text: "Proposed a cost split", sender: 'them', isProposal: true, amount: 2000, proposalStatus: 'pending' }
  ]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = { id: Date.now().toString(), text: inputText, sender: 'me' };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  };

  const handleAcceptProposal = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, proposalStatus: 'accepted' } : msg
    ));
    // Proactively guide the user to the next state
    alert("Split accepted! Payment hold will be processed once the match is finalized.");
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isProposal) {
      return (
        <View style={styles.proposalCard}>
          <Text style={styles.proposalTitle}>💰 Cost Split Proposal</Text>
          <Text style={styles.proposalAmount}>₦{item.amount?.toLocaleString()}</Text>
          {item.proposalStatus === 'pending' ? (
            <View style={styles.proposalActions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptProposal(item.id)}>
                <Text style={styles.acceptText}>Accept & Secure</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineBtn}>
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.statusAccepted}>✓ Agreed • Awaiting Escrow Check</Text>
          )}
        </View>
      );
    }

    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {/* Top Header Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#111" size={24} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Coordination Thread</Text>
            <Text style={styles.headerSubtitle}>Intent Ref: {id}</Text>
          </View>
        </View>

        {/* Message History Feed */}
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Bottom Chat Input Form Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
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
  safeArea: { flex: 1, backgroundColor: '#FFFDF9' },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EAEAEA', backgroundColor: '#FFF' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  headerSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  messageList: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 4 },
  myBubble: { backgroundColor: '#FF7A00', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: '#F0EFEA', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myText: { color: '#FFF' },
  theirText: { color: '#222' },
  
  // Cost-Split Card Component Styles
  proposalCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FF7A00', borderRadius: 12, padding: 16, marginVertical: 10, alignItems: 'center', width: '90%', alignSelf: 'center', shadowColor: '#FF7A00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  proposalTitle: { fontSize: 14, fontWeight: '600', color: '#FF7A00' },
  proposalAmount: { fontSize: 28, fontWeight: 'bold', color: '#111', marginVertical: 8 },
  proposalActions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  acceptBtn: { flex: 1, backgroundColor: '#FF7A00', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  acceptText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  declineBtn: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  declineText: { color: '#666', fontWeight: '600', fontSize: 14 },
  statusAccepted: { color: '#2E7D32', fontWeight: 'bold', fontSize: 14, marginTop: 4 },
  
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EAEAEA', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginRight: 12, color: '#111' },
  sendButton: { backgroundColor: '#FF7A00', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }
});
