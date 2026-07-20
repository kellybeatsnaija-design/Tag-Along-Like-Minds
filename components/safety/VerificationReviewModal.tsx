import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { TagAlongColors } from '../../constants/Colors';
import { getVerificationPhotoSignedUrl, getVerificationReviewContext, reviewVerificationRequest } from '../../config/queries';
import ActivityReviewContext from './ActivityReviewContext';

interface VerificationRequestSummary {
  id: string;
  type: 'id_document' | 'community';
  submission_data: { note?: string; photo_path?: string };
  created_at: string;
  requester: { id: string; first_name: string } | null;
}

interface VerificationReviewModalProps {
  visible: boolean;
  onClose: () => void;
  request: VerificationRequestSummary | null;
  onActioned: () => void;
}

export default function VerificationReviewModal({ visible, onClose, request, onActioned }: VerificationReviewModalProps) {
  const insets = useSafeAreaInsets();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState<'approve' | 'reject' | null>(null);
  const [activityContext, setActivityContext] = useState<Awaited<ReturnType<typeof getVerificationReviewContext>> | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    if (!visible || !request) {
      setPhotoUrl(null);
      setReviewNote('');
      setActivityContext(null);
      return;
    }
    const photoPath = request.submission_data?.photo_path;
    if (request.type === 'id_document' && photoPath) {
      setIsLoadingPhoto(true);
      getVerificationPhotoSignedUrl(photoPath)
        .then(setPhotoUrl)
        .catch((err) => console.error('Failed to load verification photo:', err))
        .finally(() => setIsLoadingPhoto(false));
    }
    if (request.type === 'community' && request.requester?.id) {
      setIsLoadingActivity(true);
      getVerificationReviewContext(request.requester.id)
        .then(setActivityContext)
        .catch((err) => console.error('Failed to load activity context:', err))
        .finally(() => setIsLoadingActivity(false));
    }
  }, [visible, request]);

  if (!request) return null;

  const handleDecision = async (approve: boolean) => {
    setSubmittingDecision(approve ? 'approve' : 'reject');
    try {
      await reviewVerificationRequest({ requestId: request.id, approve, reviewNote: reviewNote.trim() || null });
      onActioned();
      onClose();
    } catch (err) {
      console.error('Failed to review verification request:', err);
    } finally {
      setSubmittingDecision(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Review {request.type === 'id_document' ? 'ID' : 'Community'} Verification</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color={TagAlongColors.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.metaLine}>{request.requester?.first_name || 'Someone'}</Text>

            {request.type === 'id_document' && (
              <View style={styles.photoBox}>
                {isLoadingPhoto ? (
                  <ActivityIndicator size="small" color={TagAlongColors.primary} />
                ) : photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="contain" />
                ) : (
                  <Text style={styles.noPhotoText}>No photo attached</Text>
                )}
              </View>
            )}

            {request.submission_data?.note && (
              <Text style={styles.noteText}>{request.submission_data.note}</Text>
            )}

            {request.type === 'community' && (
              <ActivityReviewContext isLoading={isLoadingActivity} context={activityContext} />
            )}

            <Text style={styles.sectionLabel}>Review note (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Explain the decision..."
              placeholderTextColor="#999"
              value={reviewNote}
              onChangeText={setReviewNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton, !!submittingDecision && { opacity: 0.6 }]}
                onPress={() => handleDecision(false)}
                disabled={!!submittingDecision}
              >
                {submittingDecision === 'reject' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Reject</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton, !!submittingDecision && { opacity: 0.6 }]}
                onPress={() => handleDecision(true)}
                disabled={!!submittingDecision}
              >
                {submittingDecision === 'approve' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Approve</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: TagAlongColors.textDark },
  metaLine: { fontSize: 14, color: '#475569', marginBottom: 12 },
  photoBox: { height: 220, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  noPhotoText: { fontSize: 13, color: '#94A3B8' },
  noteText: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 14, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  textInput: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, color: TagAlongColors.textDark, minHeight: 70, textAlignVertical: 'top', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  rejectButton: { backgroundColor: '#DC2626' },
  approveButton: { backgroundColor: '#137333' },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
