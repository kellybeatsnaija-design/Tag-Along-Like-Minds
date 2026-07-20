import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import {
  fetchMySessions,
  cancelSession,
  toggleSessionPaused,
  completeSession,
  leaveSession,
  OPEN_SESSION_STATUSES,
  CLOSED_STATUSES,
} from '../../config/queries';
import SessionFeedbackModal from '../../components/safety/SessionFeedbackModal';

type SessionRow = Awaited<ReturnType<typeof fetchMySessions>>[number];
type Segment = 'In Progress' | 'Completed' | 'Closed';

const STATUS_META: Record<string, { color: string; label: (s: SessionRow) => string }> = {
  'Queued': { color: '#F59E0B', label: () => 'Waiting in queue' },
  'Matching': { color: '#3B82F6', label: () => 'Finding your match…' },
  'Partially Matched': {
    color: '#3B82F6',
    label: (s) => `Some matches found (${s.acceptedCandidates.length}/${s.group_size - 1})`,
  },
  'Waiting for Confirmation': { color: '#A78BFA', label: () => 'Confirming with everyone…' },
  'Ready': { color: TagAlongColors.primary, label: () => 'Ready to chat!' },
  'Completed': { color: '#64748B', label: () => 'Completed' },
  'Expired': { color: '#64748B', label: () => 'Expired' },
  'Cancelled': { color: '#64748B', label: () => 'Cancelled' },
};

export default function MyTagsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSegment, setSelectedSegment] = useState<Segment>('In Progress');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<SessionRow | null>(null);
  const sessionIdsRef = useRef<Set<string>>(new Set());

  const loadSessions = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setIsLoading(true);
    try {
      const rows = await fetchMySessions(user.id);
      setSessions(rows);
      sessionIdsRef.current = new Set(rows.map((r) => r.id));
    } catch (err) {
      console.error('Failed to load your tag-alongs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadSessions();

    const sessionsChannel = supabase
      .channel(`my-sessions:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `host_id=eq.${user.id}` },
        () => loadSessions(true)
      )
      .subscribe();

    const handshakeChannel = supabase
      .channel('my-tags-handshakes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_handshakes' },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (row?.session_id && sessionIdsRef.current.has(row.session_id)) {
            loadSessions(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(handshakeChannel);
    };
  }, [user?.id, loadSessions]);

  const segmentedSessions = sessions.filter((s) => {
    if (selectedSegment === 'In Progress') return OPEN_SESSION_STATUSES.includes(s.status);
    if (selectedSegment === 'Completed') return s.status === 'Completed';
    return CLOSED_STATUSES.includes(s.status);
  });

  const runAction = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
      await loadSessions(true);
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (session: SessionRow) => {
    Alert.alert('Cancel this tag-along?', 'This will close it and stop looking for matches.', [
      { text: 'Never mind', style: 'cancel' },
      { text: 'Yes, cancel', style: 'destructive', onPress: () => runAction(session.id, () => cancelSession(session.id)) },
    ]);
  };

  const handleTogglePause = (session: SessionRow) => {
    runAction(session.id, () => toggleSessionPaused(session.id, !session.paused));
  };

  const handleEdit = (session: SessionRow) => {
    router.push({ pathname: '/(tabs)/create-flow', params: { editSessionId: session.id } });
  };

  const handleMarkDone = (session: SessionRow) => {
    Alert.alert('Mark as done?', 'This will close the session for everyone in the group.', [
      { text: 'Never mind', style: 'cancel' },
      { text: 'Mark done', style: 'destructive', onPress: () => runAction(session.id, () => completeSession(session.id)) },
    ]);
  };

  const handleLeave = (session: SessionRow) => {
    Alert.alert(
      'Leave this tag-along?',
      "You'll stop receiving messages from this group. The rest of the group can keep going without you.",
      [
        { text: 'Never mind', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => runAction(session.id, () => leaveSession(session.id)) },
      ]
    );
  };

  const handleOpenChat = (session: SessionRow) => {
    const roomId = session.matched_into_session_id || session.id;
    router.push({ pathname: '/chat/group', params: { sessionId: roomId } });
  };

  const renderActions = (session: SessionRow) => {
    const busy = busyId === session.id;
    const buttons: { label: string; color: string; onPress: () => void }[] = [];

    if (session.status === 'Ready') {
      const isHost = !session.matched_into_session_id || session.matched_into_session_id === session.id;
      buttons.push({ label: 'Open chat', color: TagAlongColors.primary, onPress: () => handleOpenChat(session) });
      if (isHost) {
        buttons.push({ label: 'Mark as done', color: '#64748B', onPress: () => handleMarkDone(session) });
      } else {
        buttons.push({ label: 'Leave', color: '#EF4444', onPress: () => handleLeave(session) });
      }
    } else if (session.status === 'Partially Matched') {
      // At least one other person has already joined — let the host start
      // chatting right away instead of waiting for the group to fully fill.
      buttons.push({ label: 'Open chat', color: TagAlongColors.primary, onPress: () => handleOpenChat(session) });
      buttons.push({ label: 'Cancel', color: '#EF4444', onPress: () => handleCancel(session) });
    } else if (session.status === 'Queued') {
      buttons.push({ label: session.paused ? 'Resume' : 'Pause', color: '#A78BFA', onPress: () => handleTogglePause(session) });
      buttons.push({ label: 'Edit', color: '#A78BFA', onPress: () => handleEdit(session) });
      buttons.push({ label: 'Cancel', color: '#EF4444', onPress: () => handleCancel(session) });
    } else if (session.status === 'Matching') {
      buttons.push({ label: session.paused ? 'Resume' : 'Pause', color: '#A78BFA', onPress: () => handleTogglePause(session) });
    } else if (session.status === 'Completed') {
      buttons.push({ label: 'Leave feedback', color: TagAlongColors.secondary, onPress: () => setFeedbackTarget(session) });
    }

    if (buttons.length === 0) return null;

    return (
      <View style={styles.actionRow}>
        {buttons.map((btn) => (
          <TouchableOpacity
            key={btn.label}
            style={[styles.cardActionButton, { backgroundColor: btn.color, flex: 1 }, busy && { opacity: 0.6 }]}
            activeOpacity={0.8}
            disabled={busy}
            onPress={btn.onPress}
          >
            {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.cardActionButtonText}>{btn.label}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadSessions(true); }} />}
      >

        {/* Header Branding Row */}
        <View style={styles.headerBlock}>
          <Text style={styles.titleText}>My Tags</Text>
          <Text style={styles.subtitleText}>
            Your queued, matched, and completed tag-alongs.
          </Text>
        </View>

        {/* Segmented Top Nav Controller Deck */}
        <View style={styles.segmentControlRow}>
          {(['In Progress', 'Completed', 'Closed'] as const).map((segment) => {
            const isActive = selectedSegment === segment;
            return (
              <TouchableOpacity
                key={segment}
                style={[styles.segmentButton, isActive && styles.activeSegmentButton]}
                onPress={() => setSelectedSegment(segment)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, isActive && styles.activeSegmentText]}>
                  {segment}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Card Sub-Deck Renderer */}
        <View style={styles.cardContainerDeck}>
          {isLoading ? (
            <ActivityIndicator size="large" color={TagAlongColors.primary} style={{ marginTop: 40 }} />
          ) : segmentedSessions.length > 0 ? (
            segmentedSessions.map((session) => {
              const meta = STATUS_META[session.status] || { color: '#64748B', label: () => session.status };
              const metaTags = [session.connection_mode, session.comfort_mode, session.social_mood].filter(Boolean);
              const avatars = session.acceptedCandidates.slice(0, 3);
              const overflow = session.acceptedCandidates.length - avatars.length;

              return (
                <View key={session.id} style={styles.tagCard}>
                  <View style={styles.cardInfoRow}>
                    <View style={styles.textGroup}>
                      <Text style={styles.cardTitle}>{session.intent}</Text>
                      <View style={styles.statusBadgeRow}>
                        <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                        <Text style={styles.statusBadgeText}>
                          {meta.label(session)}{session.paused ? ' • Paused' : ''}
                        </Text>
                      </View>
                    </View>
                    {avatars.length > 0 ? (
                      <View style={styles.avatarStack}>
                        {avatars.map((p: any, idx: number) => (
                          <View key={idx} style={[styles.avatarMockCircle, { backgroundColor: p.avatar_color || '#A78BFA', marginLeft: idx > 0 ? -12 : 0 }]}>
                            <Text style={styles.avatarInitial}>{(p.first_name || '?')[0]?.toUpperCase()}</Text>
                          </View>
                        ))}
                        {overflow > 0 && (
                          <View style={[styles.avatarMockCircle, { backgroundColor: '#E2E8F0', marginLeft: -12 }]}>
                            <Text style={[styles.avatarInitial, { color: '#64748B' }]}>+{overflow}</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.avatarMockCircle}>
                        <Ionicons name="person-outline" size={20} color="#94A3B8" />
                      </View>
                    )}
                  </View>

                  {/* Sub-badge Meta Matrix */}
                  <View style={styles.metaBadgeMatrix}>
                    {metaTags.map((meta, idx) => (
                      <View key={idx} style={styles.metaBadgeItem}>
                        <Text style={styles.metaBadgeItemText}>{meta}</Text>
                      </View>
                    ))}
                  </View>

                  {renderActions(session)}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyStateText}>No {selectedSegment.toLowerCase()} sessions found.</Text>
          )}
        </View>

        {/* Action Trigger Launch Pad Link to step wizard */}
        <TouchableOpacity
          style={styles.floatingActionTriggerLink}
          onPress={() => router.push('/(tabs)/create-flow')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.floatingActionText}>Create new tag-along</Text>
        </TouchableOpacity>

      </ScrollView>

      <SessionFeedbackModal
        visible={!!feedbackTarget}
        onClose={() => setFeedbackTarget(null)}
        sessionId={feedbackTarget?.id ?? null}
        matchedIntoSessionId={feedbackTarget?.matched_into_session_id ?? null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TagAlongColors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  headerBlock: {
    marginBottom: 20,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: TagAlongColors.textDark,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  segmentControlRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeSegmentButton: {
    backgroundColor: TagAlongColors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeSegmentText: {
    color: '#FFFFFF',
  },
  cardContainerDeck: {
    gap: 16,
    marginBottom: 32,
    minHeight: 180,
  },
  tagCard: {
    backgroundColor: TagAlongColors.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  textGroup: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TagAlongColors.textDark,
    marginBottom: 6,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  avatarMockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  metaBadgeMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  metaBadgeItem: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  metaBadgeItemText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardActionButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 40,
  },
  floatingActionTriggerLink: {
    backgroundColor: TagAlongColors.primary,
    borderRadius: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TagAlongColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
