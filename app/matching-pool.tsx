import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../constants/Colors';

const MOCK_POTENTIAL_MATCHES = [
  { id: '1', name: 'Zoe', matchScore: '96%', focus: 'Language practice', activeMode: 'Chat' },
  { id: '2', name: 'Marcus', matchScore: '89%', focus: 'Language practice', activeMode: 'Voice' },
];

export default function MatchingPoolScreen() {
  const router = useRouter();
  const [matchingStatus, setMatchingStatus] = useState<'scanning' | 'success' | 'failed'>('scanning');

  useEffect(() => {
    // Simulate real-time matchmaking delay over backend network sockets
    const scanTimer = setTimeout(() => {
      // PRO-TIP: Flip this to test 'failed' empty state fallback logic fluidly!
      const mockApiSucceeded = true; 
      setMatchingStatus(mockApiSucceeded ? 'success' : 'failed');
    }, 3000);

    return () => clearTimeout(scanTimer);
  }, []);

  return (
    <View style={styles.container}>
      {/* ========================================================
          STATE A: ACTIVE SCANNING RADAR STREAM
         ======================================================== */}
      {matchingStatus === 'scanning' && (
        <View style={styles.centerFocusWrapper}>
          <ActivityIndicator size="large" color={TagAlongColors.primary} style={{ marginBottom: 20 }} />
          <Text style={styles.loadingHeadingText}>Scanning for Matches...</Text>
          <Text style={styles.loadingSubtext}>
            Finding people whose social energy, timing preferences, and comfort boundaries sync with yours.
          </Text>
        </View>
      )}

      {/* ========================================================
          STATE B: MATCH SUCCESS STREAM FEED
         ======================================================== */}
      {matchingStatus === 'success' && (
        <View style={styles.innerLayoutStack}>
          <Text style={styles.mainTitleText}>Matches Found! 🎉</Text>
          <Text style={styles.subPromptText}>Confirm an online match to start your tag-along check-in.</Text>
          
          <ScrollView contentContainerStyle={styles.scrollDeck} showsVerticalScrollIndicator={false}>
            {MOCK_POTENTIAL_MATCHES.map((profile) => (
              <View key={profile.id} style={styles.profileCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={24} color={TagAlongColors.primary} />
                  </View>
                  <View style={styles.metaTextGroup}>
                    <Text style={styles.profileNameText}>{profile.name}</Text>
                    <Text style={styles.profileMetaLabel}>{profile.focus} • {profile.activeMode}</Text>
                  </View>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{profile.matchScore} fit</Text>
                  </View>
                </View>

                {/* Accept/Decline Control Trigger Actions Grid */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => alert('Declined match submission.')}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => router.replace('/(tabs)/my-tags')}>
                    <Text style={styles.confirmBtnText}>Confirm Match</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ========================================================
          STATE C: MATCH FAILED UNSET FALLBACK HUB
         ======================================================== */}
      {matchingStatus === 'failed' && (
        <View style={styles.centerFocusWrapper}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="search-outline" size={40} color="#64748B" />
          </View>
          <Text style={styles.loadingHeadingText}>No matches right now</Text>
          <Text style={styles.loadingSubtext}>
            Everyone might be checked into active streams or away. Let's widen your filters or plan for later.
          </Text>

          {/* Action Fallbacks Deck */}
          <View style={styles.fallbackActionGroup}>
            <TouchableOpacity style={styles.widenFiltersBtn} onPress={() => router.back()}>
              <Ionicons name="options-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.widenFiltersBtnText}>Adjust Match Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelSessionBtn} onPress={() => router.replace('/(tabs)/my-tags')}>
              <Text style={styles.cancelSessionBtnText}>Cancel and return home</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', paddingHorizontal: 24, justifyContent: 'center' },
  centerFocusWrapper: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  innerLayoutStack: { flex: 1, paddingTop: 70 },
  loadingHeadingText: { fontSize: 22, fontWeight: '700', color: TagAlongColors.textDark, textAlign: 'center', marginBottom: 8 },
  loadingSubtext: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 },
  mainTitleText: { fontSize: 24, fontWeight: '700', color: TagAlongColors.textDark, marginBottom: 6 },
  subPromptText: { fontSize: 14, color: '#64748B', marginBottom: 24 },
  scrollDeck: { gap: 16, paddingBottom: 40 },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  metaTextGroup: { flex: 1 },
  profileNameText: { fontSize: 16, fontWeight: '700', color: TagAlongColors.textDark },
  profileMetaLabel: { fontSize: 13, color: '#64748B', marginTop: 2 },
  scoreBadge: { backgroundColor: '#DCFCE7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  scoreText: { color: '#15803D', fontSize: 12, fontWeight: '700' },
  actionButtonsRow: { flexDirection: 'row', gap: 10 },
  declineBtn: { flex: 1, backgroundColor: '#F1F5F9', height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  declineBtnText: { color: '#475569', fontSize: 14, fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: TagAlongColors.primary, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  errorIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  fallbackActionGroup: { width: '100%', gap: 12, marginTop: 28 },
  widenFiltersBtn: { backgroundColor: TagAlongColors.primary, height: 50, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  widenFiltersBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cancelSessionBtn: { backgroundColor: '#E2E8F0', height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cancelSessionBtnText: { color: TagAlongColors.textDark, fontSize: 15, fontWeight: '600' }
});
