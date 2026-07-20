import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react-native';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { fetchPublicProfileCards, submitSessionFeedback, POSITIVE_FEEDBACK_TAGS, NEGATIVE_FEEDBACK_TAGS } from '../../config/queries';

interface FeedbackParticipant {
  id: string;
  first_name: string;
  avatar_color: string;
}

interface SessionFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  sessionId: string | null;
  matchedIntoSessionId?: string | null;
}

export default function SessionFeedbackModal({ visible, onClose, sessionId, matchedIntoSessionId }: SessionFeedbackModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [participants, setParticipants] = useState<FeedbackParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [isPositive, setIsPositive] = useState(true);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomId = matchedIntoSessionId || sessionId;

  useEffect(() => {
    if (!visible || !roomId || !user?.id) return;

    const load = async () => {
      setIsLoading(true);
      setPageIndex(0);
      try {
        const { data: room } = await supabase.from('sessions').select('host_id').eq('id', roomId).maybeSingle();
        const { data: handshakes } = await supabase
          .from('match_handshakes')
          .select('candidate_id')
          .eq('session_id', roomId)
          .eq('status', 'accepted');

        const ids = new Set<string>();
        if (room?.host_id) ids.add(room.host_id);
        (handshakes || []).forEach((h: any) => ids.add(h.candidate_id));
        ids.delete(user.id);

        const cards = await fetchPublicProfileCards(Array.from(ids));
        setParticipants(cards as FeedbackParticipant[]);
      } catch (err) {
        console.error('Failed to load session participants for feedback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [visible, roomId, user?.id]);

  const currentParticipant = participants[pageIndex];
  const tagOptions = isPositive ? POSITIVE_FEEDBACK_TAGS : NEGATIVE_FEEDBACK_TAGS;

  const resetPageState = () => {
    setIsPositive(true);
    setSelectedTags(new Set());
    setNote('');
  };

  const toggleTag = (value: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const advance = () => {
    resetPageState();
    if (pageIndex + 1 >= participants.length) {
      onClose();
    } else {
      setPageIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => advance();

  const handleSubmit = async () => {
    if (!roomId || !currentParticipant) return;
    setIsSubmitting(true);
    try {
      await submitSessionFeedback({
        sessionId: roomId,
        ratedUserId: currentParticipant.id,
        signal: isPositive ? 'positive' : 'negative',
        tags: Array.from(selectedTags),
        note: note.trim() || null,
      });
      advance();
    } catch (err: any) {
      console.error('Failed to submit session feedback:', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {currentParticipant
                ? `Feedback for ${currentParticipant.first_name} · ${pageIndex + 1} of ${participants.length}`
                : 'Leave feedback'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={TagAlongColors.textDark} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={TagAlongColors.primary} style={{ marginVertical: 30 }} />
          ) : !currentParticipant ? (
            <Text style={styles.emptyText}>No one else to leave feedback for.</Text>
          ) : (
            <>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleButton, isPositive && styles.toggleButtonActivePositive]}
                  onPress={() => setIsPositive(true)}
                >
                  <ThumbsUp size={18} color={isPositive ? '#FFFFFF' : '#137333'} />
                  <Text style={[styles.toggleText, isPositive && styles.toggleTextActive]}>Positive</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !isPositive && styles.toggleButtonActiveNegative]}
                  onPress={() => setIsPositive(false)}
                >
                  <ThumbsDown size={18} color={!isPositive ? '#FFFFFF' : '#DC2626'} />
                  <Text style={[styles.toggleText, !isPositive && styles.toggleTextActive]}>Negative</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipRow}>
                {tagOptions.map((chip) => (
                  <TouchableOpacity
                    key={chip.value}
                    style={[styles.chip, selectedTags.has(chip.value) && styles.chipActive]}
                    onPress={() => toggleTag(chip.value)}
                  >
                    <Text style={[styles.chipText, selectedTags.has(chip.value) && styles.chipTextActive]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="Add a note (optional)"
                placeholderTextColor="#999"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
              />

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={isSubmitting}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {pageIndex + 1 >= participants.length ? 'Done' : 'Next'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: TagAlongColors.textDark, flex: 1, paddingRight: 12 },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 14, marginVertical: 30 },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F1F5F9' },
  toggleButtonActivePositive: { backgroundColor: '#137333' },
  toggleButtonActiveNegative: { backgroundColor: '#DC2626' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  toggleTextActive: { color: '#FFFFFF' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#E6F4EA', borderColor: '#137333' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#137333' },
  textInput: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, color: TagAlongColors.textDark, minHeight: 60, textAlignVertical: 'top', marginBottom: 18 },
  actionRow: { flexDirection: 'row', gap: 10 },
  skipButton: { flex: 1, borderRadius: 16, paddingVertical: 15, alignItems: 'center', backgroundColor: '#F1F5F9' },
  skipButtonText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  submitButton: { flex: 2, borderRadius: 16, paddingVertical: 15, alignItems: 'center', backgroundColor: TagAlongColors.primary },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
