import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { updateProfileSettings } from '../../config/queries';
import Step2GroupSize from '../../components/Step2GroupSize';
import Step3ComfortPreferences from '../../components/Step3ComfortPreferences';
import Step4SessionMood from '../../components/Step4SessionMood';
import Step6InteractionMode from '../../components/Step6InteractionMode';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');

  const [comfortMode, setComfortMode] = useState<'anyone' | 'same-gender'>('anyone');
  const [specificGenders, setSpecificGenders] = useState<string[]>([]);
  const [groupSize, setGroupSize] = useState<number | null>(null);
  const [socialMood, setSocialMood] = useState('');
  const [connectMode, setConnectMode] = useState<'chat' | 'call'>('chat');

  const [anonymityLevel, setAnonymityLevel] = useState<'full_name' | 'first_initial'>('full_name');
  const [showVerificationBadges, setShowVerificationBadges] = useState(true);
  const [showReputationState, setShowReputationState] = useState(true);

  const [emailVerified, setEmailVerified] = useState(false);
  const [communityVerified, setCommunityVerified] = useState(false);
  const [idVerified, setIdVerified] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          first_name, bio, interests, anonymity_level, show_verification_badges, show_reputation_state,
          default_comfort_mode, default_group_size, default_connection_mode, default_social_mood,
          email_verified_at, community_verified_at, id_verified_at
        `)
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setFirstName(data.first_name || '');
        setBio(data.bio || '');
        setInterests(Array.isArray(data.interests) ? data.interests : []);
        setAnonymityLevel((data.anonymity_level as 'full_name' | 'first_initial') || 'full_name');
        setShowVerificationBadges(data.show_verification_badges ?? true);
        setShowReputationState(data.show_reputation_state ?? true);
        setGroupSize(data.default_group_size ?? null);
        setSocialMood(data.default_social_mood || '');
        // Legacy 'voice'/'meeting' defaults predate the in-app calling merge — treat as 'call'.
        setConnectMode(!data.default_connection_mode || data.default_connection_mode === 'chat' ? 'chat' : 'call');
        if (data.default_comfort_mode && data.default_comfort_mode !== 'Anyone') {
          setComfortMode('same-gender');
          setSpecificGenders(data.default_comfort_mode.split(', ').filter(Boolean));
        }
        setEmailVerified(!!data.email_verified_at);
        setCommunityVerified(!!data.community_verified_at);
        setIdVerified(!!data.id_verified_at);
      }
      setIsLoading(false);
    };

    load();
  }, [user?.id]);

  const handleAddInterest = () => {
    const trimmed = interestInput.trim();
    if (!trimmed || interests.includes(trimmed)) {
      setInterestInput('');
      return;
    }
    setInterests((prev) => [...prev, trimmed]);
    setInterestInput('');
  };

  const handleRemoveInterest = (tag: string) => {
    setInterests((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const comfortModeText = comfortMode === 'anyone' ? 'Anyone' : specificGenders.join(', ');
      await updateProfileSettings(user.id, {
        firstName: firstName.trim() || undefined,
        bio: bio.trim() || null,
        interests,
        anonymityLevel,
        showVerificationBadges,
        showReputationState,
        defaultComfortMode: comfortModeText,
        defaultGroupSize: groupSize,
        defaultConnectionMode: connectMode,
        defaultSocialMood: socialMood || null,
      });
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    } catch (err: any) {
      Alert.alert('Could not save', err.message || 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Display &amp; Bio</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Display name</Text>
          <TextInput
            style={styles.textInput}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Your name"
            placeholderTextColor="#999"
          />
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Bio</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people a little about yourself"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.card}>
          <View style={styles.interestInputRow}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={interestInput}
              onChangeText={setInterestInput}
              placeholder="Add an interest"
              placeholderTextColor="#999"
              onSubmitEditing={handleAddInterest}
            />
            <TouchableOpacity style={styles.addInterestButton} onPress={handleAddInterest}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.interestChipRow}>
            {interests.length > 0 ? interests.map((tag) => (
              <TouchableOpacity key={tag} style={styles.interestChip} onPress={() => handleRemoveInterest(tag)}>
                <Text style={styles.interestChipText}>{tag}</Text>
                <Ionicons name="close" size={13} color={TagAlongColors.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyHint}>No interests added yet.</Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Comfort Boundaries</Text>
        <View style={styles.card}>
          <Step3ComfortPreferences
            comfortMode={comfortMode}
            setComfortMode={setComfortMode}
            specificGenders={specificGenders}
            setSpecificGenders={setSpecificGenders}
          />
        </View>

        <Text style={styles.sectionTitle}>Session Preferences</Text>
        <Text style={styles.sectionHint}>These pre-fill new tag-alongs so you don't have to re-pick them every time.</Text>
        <View style={styles.card}>
          <Step2GroupSize value={groupSize} onChange={setGroupSize} />
        </View>
        <View style={styles.card}>
          <Step4SessionMood value={socialMood} onChange={setSocialMood} />
        </View>
        <View style={styles.card}>
          <Step6InteractionMode value={connectMode} onChange={setConnectMode} />
        </View>

        <Text style={styles.sectionTitle}>Verification Status</Text>
        <View style={styles.card}>
          {[
            { label: 'Email', verified: emailVerified },
            { label: 'Community', verified: communityVerified },
            { label: 'ID', verified: idVerified },
          ].map((row) => (
            <View key={row.label} style={styles.verificationRow}>
              <Text style={styles.fieldLabel}>{row.label}</Text>
              <View style={styles.verificationStatusPill}>
                <Ionicons
                  name={row.verified ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={row.verified ? '#137333' : '#94A3B8'}
                />
                <Text style={[styles.verificationStatusText, { color: row.verified ? '#137333' : '#94A3B8' }]}>
                  {row.verified ? 'Verified' : 'Not verified'}
                </Text>
              </View>
            </View>
          ))}
          {(!communityVerified || !idVerified) && (
            <TouchableOpacity onPress={() => router.push('/safety/verify-identity')} style={styles.verifyLink}>
              <Text style={styles.verifyLinkText}>Submit a verification →</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Privacy Controls</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>How your name appears to others</Text>
          <View style={styles.anonymityToggleRow}>
            <TouchableOpacity
              style={[styles.anonymityOption, anonymityLevel === 'full_name' && styles.anonymityOptionActive]}
              onPress={() => setAnonymityLevel('full_name')}
            >
              <Text style={[styles.anonymityOptionText, anonymityLevel === 'full_name' && styles.anonymityOptionTextActive]}>
                First name
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.anonymityOption, anonymityLevel === 'first_initial' && styles.anonymityOptionActive]}
              onPress={() => setAnonymityLevel('first_initial')}
            >
              <Text style={[styles.anonymityOptionText, anonymityLevel === 'first_initial' && styles.anonymityOptionTextActive]}>
                First initial only
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Show verification badges to others</Text>
            <Switch value={showVerificationBadges} onValueChange={setShowVerificationBadges} trackColor={{ true: TagAlongColors.primary }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Show reputation tier to others</Text>
            <Switch value={showReputationState} onValueChange={setShowReputationState} trackColor={{ true: TagAlongColors.primary }} />
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, isSaving && { opacity: 0.6 }]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TagAlongColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TagAlongColors.textDark },
  scrollContent: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
  sectionHint: { fontSize: 12, color: '#94A3B8', marginBottom: 10, marginTop: -4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: TagAlongColors.textDark, marginBottom: 6 },
  textInput: { backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: TagAlongColors.textDark },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  interestInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addInterestButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: TagAlongColors.primary, alignItems: 'center', justifyContent: 'center' },
  interestChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  interestChipText: { fontSize: 13, fontWeight: '600', color: TagAlongColors.textDark },
  emptyHint: { fontSize: 13, color: '#94A3B8' },
  verificationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  verificationStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verificationStatusText: { fontSize: 12, fontWeight: '700' },
  verifyLink: { marginTop: 8 },
  verifyLinkText: { fontSize: 13, fontWeight: '700', color: TagAlongColors.primary },
  anonymityToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  anonymityOption: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  anonymityOptionActive: { backgroundColor: TagAlongColors.primary, borderColor: TagAlongColors.primary },
  anonymityOptionText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  anonymityOptionTextActive: { color: '#FFFFFF' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  saveButton: { backgroundColor: TagAlongColors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
