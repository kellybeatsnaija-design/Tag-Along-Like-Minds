import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, CheckCircle2, LogOut, MoreVertical, ShieldCheck, Phone } from 'lucide-react-native';
import { BRAND_COLORS } from '../../constants/Colors';
import { supabase } from '../../config/supabase';
import { sendLiveMessage, completeSession, leaveSession, fetchBlockedUsers, unblockUser, fetchPublicProfileCards } from '../../config/queries';
import { useAuth } from '../../context/AuthContext';
import { getReputationMeta } from '../../constants/reputation';
import ParticipantActionSheet from '../../components/safety/ParticipantActionSheet';
import BlockReportModal from '../../components/safety/BlockReportModal';

interface Message {
  id: string;
  text: string;
  senderId: string;
  sender: 'me' | 'group';
}

interface Participant {
  id: string;
  first_name: string;
  avatar_color: string;
  reputation_state?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  is_id_verified?: boolean;
  is_community_verified?: boolean;
}

export default function GroupChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const sessionId = params.sessionId ? String(params.sessionId) : '';

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [intentTag, setIntentTag] = useState('Shared connection');
  const [groupSize, setGroupSize] = useState(1);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [actionSheetTarget, setActionSheetTarget] = useState<Participant | null>(null);
  const [blockReportState, setBlockReportState] = useState<{ target: Participant; tab: 'block' | 'report' } | null>(null);

  const isHost = !!(user?.id && hostId && user.id === hostId);

  useEffect(() => {
    if (!sessionId || !user?.id) return;

    const hydrateRoom = async () => {
      const { data: sessionRow } = await supabase
        .from('sessions')
        .select('host_id, intent, group_size, status, scheduled_at')
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionRow) {
        setIntentTag(sessionRow.intent || 'Shared connection');
        setGroupSize(sessionRow.group_size || 1);
        setHostId(sessionRow.host_id || null);
        setSessionStatus(sessionRow.status || null);
        setScheduledAt(sessionRow.scheduled_at || null);
      }

      const { data: handshakeRows } = await supabase
        .from('match_handshakes')
        .select('candidate_id')
        .eq('session_id', sessionId)
        .eq('status', 'accepted');

      const { data: exitRows } = await supabase
        .from('session_exits')
        .select('user_id')
        .eq('session_id', sessionId)
        .in('exit_type', ['left', 'removed']);
      const exitedIds = new Set((exitRows || []).map((r: any) => r.user_id));

      const participantIds = new Set<string>();
      if (sessionRow?.host_id && !exitedIds.has(sessionRow.host_id)) participantIds.add(sessionRow.host_id);
      (handshakeRows || []).forEach((row: any) => {
        if (!exitedIds.has(row.candidate_id)) participantIds.add(row.candidate_id);
      });

      if (participantIds.size > 0) {
        const cards = await fetchPublicProfileCards(Array.from(participantIds));
        setParticipants(cards as Participant[]);
      }

      const blocked = await fetchBlockedUsers(user.id);
      setBlockedIds(new Set(blocked.map((b: any) => b.blocked_id)));

      const { data: messageRows, error } = await supabase
        .from('messages')
        .select('id, sender_id, message_text, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && messageRows) {
        setMessages(messageRows.map((row: any) => ({
          id: row.id,
          text: row.message_text,
          senderId: row.sender_id,
          sender: row.sender_id === user?.id ? 'me' : 'group',
        })));
      }
    };

    hydrateRoom();

    const chatChannel = supabase
      .channel(`room:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as any;
          if (row.sender_id === user?.id) return;
          setMessages(prev => [...prev, { id: row.id, text: row.message_text, senderId: row.sender_id, sender: 'group' }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [sessionId, user?.id]);

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || !sessionId || !user?.id) return;
    setInputText('');

    setMessages(prev => [...prev, { id: `local_${Date.now()}`, text, senderId: user.id, sender: 'me' }]);

    const senderName = user.email ? user.email.split('@')[0] : 'You';
    await sendLiveMessage(sessionId, user.id, senderName, text);
  };

  const handleMarkDone = () => {
    Alert.alert(
      'Mark as done?',
      'This will close the session for everyone in the group.',
      [
        { text: 'Never mind', style: 'cancel' },
        {
          text: 'Mark done',
          style: 'destructive',
          onPress: async () => {
            setIsCompleting(true);
            try {
              await completeSession(sessionId);
              router.replace('/(tabs)/my-tags');
            } catch (err: any) {
              Alert.alert('Could not complete session', err.message || 'Please try again.');
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave this tag-along?',
      "You'll stop receiving messages from this group. The rest of the group can keep going without you.",
      [
        { text: 'Never mind', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setIsLeaving(true);
            try {
              await leaveSession(sessionId);
              router.replace('/(tabs)/my-tags');
            } catch (err: any) {
              Alert.alert('Could not leave', err.message || 'Please try again.');
            } finally {
              setIsLeaving(false);
            }
          },
        },
      ]
    );
  };

  const refreshBlockedIds = async () => {
    if (!user?.id) return;
    const blocked = await fetchBlockedUsers(user.id);
    setBlockedIds(new Set(blocked.map((b: any) => b.blocked_id)));
  };

  const visibleMessages = messages.filter(m => !blockedIds.has(m.senderId));
  const isCallScheduledForLater = !!scheduledAt && new Date(scheduledAt).getTime() > Date.now();
  // Calling is available in every matched group regardless of which mode was
  // picked at creation — that choice only governs the scheduled-time/reminder
  // flow now, not whether a call is possible at all.
  const canJoinCall = sessionStatus === 'Ready' || sessionStatus === 'Partially Matched';

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
            <Text style={styles.headerSubtitle}>{intentTag} • {groupSize} {groupSize === 1 ? 'person' : 'people'}</Text>
          </View>
          <TouchableOpacity onPress={handleLeave} style={styles.headerActionButton} disabled={isLeaving}>
            <LogOut color="#EF4444" size={22} />
          </TouchableOpacity>
          {isHost && (
            <TouchableOpacity onPress={handleMarkDone} style={styles.headerActionButton} disabled={isCompleting}>
              <CheckCircle2 color={BRAND_COLORS.primary} size={24} />
            </TouchableOpacity>
          )}
        </View>

        {canJoinCall && (
          <TouchableOpacity
            style={styles.joinCallRow}
            activeOpacity={isCallScheduledForLater ? 1 : 0.8}
            disabled={isCallScheduledForLater}
            onPress={() => router.push({ pathname: '/chat/call', params: { sessionId } })}
          >
            <View style={styles.joinCallIconCircle}>
              <Phone color={BRAND_COLORS.primary} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.joinCallTitle}>
                {isCallScheduledForLater ? 'Call scheduled' : 'Voice/video call'}
              </Text>
              <Text style={styles.joinCallSubtitle}>
                {isCallScheduledForLater
                  ? `Starts ${new Date(scheduledAt as string).toLocaleString()}`
                  : 'Everyone in this tag-along can join right now'}
              </Text>
            </View>
            {!isCallScheduledForLater && <Text style={styles.joinCallCta}>Join call</Text>}
          </TouchableOpacity>
        )}

        <View style={styles.groupDetailsSection}>
          <View style={styles.participantHeaderRow}>
            <Text style={styles.groupDetailLabel}>Participants</Text>
            <Text style={styles.participantCountText}>{participants.length} joined</Text>
          </View>
          <View style={styles.participantListRow}>
            {participants.length > 0 ? participants.map((p) => {
              const isSelf = p.id === user?.id;
              const isBlocked = blockedIds.has(p.id);
              const isVerified = p.is_email_verified || p.is_phone_verified || p.is_id_verified || p.is_community_verified;
              const repColor = getReputationMeta(p.reputation_state).color;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.participantPill, isBlocked && styles.participantPillBlocked]}
                  disabled={isSelf}
                  onPress={() => setActionSheetTarget(p)}
                  activeOpacity={isSelf ? 1 : 0.7}
                >
                  <View style={[styles.reputationDot, { backgroundColor: repColor }]} />
                  <Text style={styles.participantPillText}>
                    {p.first_name}{isSelf ? ' (You)' : ''}{isBlocked ? ' · Blocked' : ''}
                  </Text>
                  {isVerified && <ShieldCheck size={13} color={BRAND_COLORS.primary} style={{ marginLeft: 4 }} />}
                  {!isSelf && <MoreVertical size={14} color={BRAND_COLORS.textMuted} style={{ marginLeft: 6 }} />}
                </TouchableOpacity>
              );
            }) : (
              <Text style={styles.noParticipantsText}>No participants yet</Text>
            )}
          </View>
        </View>

        <FlatList
          data={visibleMessages}
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
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Send color="#FFF" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ParticipantActionSheet
        visible={!!actionSheetTarget}
        onClose={() => setActionSheetTarget(null)}
        targetUserName={actionSheetTarget?.first_name || ''}
        isBlocked={actionSheetTarget ? blockedIds.has(actionSheetTarget.id) : false}
        onSelectBlock={() => {
          if (!actionSheetTarget) return;
          setBlockReportState({ target: actionSheetTarget, tab: 'block' });
          setActionSheetTarget(null);
        }}
        onSelectReport={() => {
          if (!actionSheetTarget) return;
          setBlockReportState({ target: actionSheetTarget, tab: 'report' });
          setActionSheetTarget(null);
        }}
        onSelectUnblock={async () => {
          if (!actionSheetTarget) return;
          const target = actionSheetTarget;
          setActionSheetTarget(null);
          try {
            const blocked = await fetchBlockedUsers(user!.id);
            const row = blocked.find((b: any) => b.blocked_id === target.id);
            if (row) {
              await unblockUser((row as any).id);
              await refreshBlockedIds();
            }
          } catch (err: any) {
            Alert.alert('Could not unblock', err.message || 'Please try again.');
          }
        }}
      />

      {blockReportState && (
        <BlockReportModal
          visible={!!blockReportState}
          onClose={() => setBlockReportState(null)}
          targetUserId={blockReportState.target.id}
          targetUserName={blockReportState.target.first_name}
          sessionId={sessionId}
          initialTab={blockReportState.tab}
          onBlocked={async () => {
            await refreshBlockedIds();
            Alert.alert(
              'Blocked',
              `You won't see ${blockReportState.target.first_name}'s messages anymore, and you won't be matched together again. Leave this tag-along too?`,
              [
                { text: 'Stay', style: 'cancel' },
                { text: 'Leave chat', style: 'destructive', onPress: handleLeave },
              ]
            );
          }}
          onReported={() => {
            Alert.alert('Report submitted', 'Our moderation team will review this soon.');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BRAND_COLORS.bgCanvas },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: BRAND_COLORS.borderLight, backgroundColor: BRAND_COLORS.cardWhite },
  backButton: { marginRight: 16 },
  headerTextWrapper: { flex: 1 },
  headerActionButton: { marginLeft: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: BRAND_COLORS.textDark },
  headerSubtitle: { fontSize: 12, color: BRAND_COLORS.textMuted, marginTop: 2 },
  joinCallRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: BRAND_COLORS.cardWhite, borderRadius: 20, padding: 16, marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderColor: BRAND_COLORS.borderLight },
  joinCallIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND_COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  joinCallTitle: { fontSize: 14, fontWeight: '700', color: BRAND_COLORS.textDark },
  joinCallSubtitle: { fontSize: 12, color: BRAND_COLORS.textMuted, marginTop: 2 },
  joinCallCta: { fontSize: 13, fontWeight: '700', color: BRAND_COLORS.primary },
  groupDetailsSection: { backgroundColor: BRAND_COLORS.primaryLight, borderRadius: 20, padding: 18, margin: 16, borderWidth: 1, borderColor: BRAND_COLORS.borderLight },
  groupDetailLabel: { fontSize: 12, fontWeight: '700', color: BRAND_COLORS.textMuted, marginBottom: 4 },
  participantHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  participantCountText: { fontSize: 12, fontWeight: '700', color: BRAND_COLORS.primary },
  participantListRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  participantPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: BRAND_COLORS.cardWhite, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: BRAND_COLORS.borderLight, marginBottom: 8 },
  reputationDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  participantPillBlocked: { opacity: 0.5 },
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
