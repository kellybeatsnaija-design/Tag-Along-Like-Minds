import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyVerificationRequests,
  submitVerificationRequest,
  uploadVerificationPhoto,
  VerificationType,
} from '../../config/queries';

const TYPE_META: Record<VerificationType, { title: string; description: string }> = {
  id_document: {
    title: 'ID Verification',
    description: 'Submit a photo of a government ID. A moderator reviews it before approving.',
  },
  community: {
    title: 'Community Verification',
    description: 'Tell us a bit about your community ties. A moderator reviews your note before approving.',
  },
};

export default function VerifyIdentityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const type = (params.type === 'community' ? 'community' : 'id_document') as VerificationType;
  const meta = TYPE_META[type];

  const [isLoading, setIsLoading] = useState(true);
  const [latestRequest, setLatestRequest] = useState<any | null>(null);
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const rows = await fetchMyVerificationRequests(user.id);
      const latest = rows.find((r: any) => r.type === type) || null;
      setLatestRequest(latest);
    } catch (err) {
      console.error('Failed to load verification status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, type]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to submit an ID verification photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (type === 'id_document' && !photoUri) {
      Alert.alert('Photo required', 'Please add a photo of your ID before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      let photoPath: string | undefined;
      if (type === 'id_document' && photoUri) {
        photoPath = await uploadVerificationPhoto(user.id, photoUri);
      }
      await submitVerificationRequest({ type, note: note.trim() || null, photoPath });
      await load();
      setNote('');
      setPhotoUri(null);
      Alert.alert('Submitted', 'Your request is now pending review.');
    } catch (err: any) {
      Alert.alert('Could not submit', err.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusCard = () => {
    if (!latestRequest) return null;
    if (latestRequest.status === 'pending') {
      return (
        <View style={styles.statusCard}>
          <Ionicons name="time-outline" size={22} color="#F59E0B" />
          <Text style={styles.statusTitle}>Submitted, under review</Text>
          <Text style={styles.statusSubtext}>
            Submitted {new Date(latestRequest.created_at).toLocaleDateString()}
          </Text>
        </View>
      );
    }
    if (latestRequest.status === 'approved') {
      return (
        <View style={[styles.statusCard, styles.statusCardApproved]}>
          <Ionicons name="checkmark-circle" size={22} color="#137333" />
          <Text style={styles.statusTitle}>Approved</Text>
        </View>
      );
    }
    return null;
  };

  const showForm = !latestRequest || latestRequest.status === 'rejected';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={TagAlongColors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TagAlongColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{meta.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>{meta.description}</Text>

        {latestRequest?.status === 'pending' || latestRequest?.status === 'approved' ? (
          renderStatusCard()
        ) : (
          <>
            {latestRequest?.status === 'rejected' && (
              <View style={[styles.statusCard, styles.statusCardRejected]}>
                <Ionicons name="close-circle" size={22} color="#DC2626" />
                <Text style={styles.statusTitle}>Not approved</Text>
                {latestRequest.review_note && (
                  <Text style={styles.statusSubtext}>{latestRequest.review_note}</Text>
                )}
                <Text style={styles.statusSubtext}>You can submit a new request below.</Text>
              </View>
            )}

            {showForm && (
              <View style={styles.formCard}>
                {type === 'id_document' && (
                  <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={28} color="#94A3B8" />
                        <Text style={styles.photoPickerText}>Add a photo of your ID</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                <TextInput
                  style={styles.textInput}
                  placeholder={type === 'id_document' ? 'Note (optional)' : 'Tell us about your community ties'}
                  placeholderTextColor="#999"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit for review</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TagAlongColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TagAlongColors.textDark },
  scrollContent: { padding: 20, paddingBottom: 40 },
  description: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 20 },
  statusCard: { backgroundColor: '#FEF3C7', borderRadius: 16, padding: 18, alignItems: 'center', gap: 6, marginBottom: 16 },
  statusCardApproved: { backgroundColor: '#E6F4EA' },
  statusCardRejected: { backgroundColor: '#FEE2E2' },
  statusTitle: { fontSize: 15, fontWeight: '700', color: TagAlongColors.textDark },
  statusSubtext: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', gap: 14 },
  photoPicker: { height: 160, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  photoPickerText: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 8 },
  textInput: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 14, fontSize: 14, color: TagAlongColors.textDark, minHeight: 90, textAlignVertical: 'top' },
  submitButton: { backgroundColor: TagAlongColors.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
