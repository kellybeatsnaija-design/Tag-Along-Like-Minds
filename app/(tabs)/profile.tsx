import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import ProfileReputationCard from '../../components/profile/ProfileReputationCard';
import ProfileRowItem from '../../components/profile/ProfileRowItem';
import { supabase } from '../../config/supabase';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useTrustProfile } from '../../hooks/use-trust-profile';
import { fetchBlockedUsers } from '../../config/queries';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, isModerator } = useAuth();
  const trust = useTrustProfile(user?.id);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    const fetchBlockedCount = async () => {
      if (!user?.id) return;
      try {
        const rows = await fetchBlockedUsers(user.id);
        setBlockedCount(rows.length);
      } catch (err) {
        console.error('Failed to fetch blocked users count:', err);
      }
    };

    fetchBlockedCount();
  }, [user]);

  const userEmail = user?.email || 'guest@example.com';
  const displayIdentityName = trust.first_name || 'Member';

  // Privacy Guard is a real reflection of the user's own visibility settings now —
  // it no longer duplicates moderation standing (that's ProfileReputationCard's job,
  // via reputation_state(), which is already standing-aware).
  const isPrivacyGuardActive =
    trust.anonymity_level === 'first_initial' || !trust.show_verification_badges || !trust.show_reputation_state;
  const privacyBadge = isPrivacyGuardActive
    ? { icon: 'shield-checkmark' as const, bg: '#E6F4EA', color: '#137333', text: 'Privacy Guard Active' }
    : { icon: 'shield-outline' as const, bg: '#F1F5F9', color: '#64748B', text: 'Standard visibility' };

  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
      if (error) throw error;
      Alert.alert('Email sent', `We sent a new confirmation link to ${user.email}.`);
    } catch (err: any) {
      Alert.alert('Could not resend', err.message || 'Please try again.');
    }
  };

  const handlePressEmailBadge = () => {
    if (trust.email_verified_at) {
      Alert.alert('Email verified', `Verified on ${new Date(trust.email_verified_at).toLocaleDateString()}.`);
    } else {
      Alert.alert(
        'Email not verified',
        'Confirm your email to unlock the Verified reputation tier.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Resend confirmation', onPress: handleResendConfirmation },
        ]
      );
    }
  };

  const verificationPills = [
    { key: 'email', label: 'Email', verified: !!trust.email_verified_at, onPress: handlePressEmailBadge },
    {
      key: 'community',
      label: 'Community',
      verified: !!trust.community_verified_at,
      onPress: () => router.push({ pathname: '/safety/verify-identity', params: { type: 'community' } }),
    },
    {
      key: 'id',
      label: 'ID',
      verified: !!trust.id_verified_at,
      onPress: () => router.push({ pathname: '/safety/verify-identity', params: { type: 'id_document' } }),
    },
  ];

  const handleLogoutSequence = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to end your secure connection session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              // Global route guard automatically detects session clearance and drops onto /auth
              router.replace('/auth');
            } catch (err: any) {
              Alert.alert("Logout Failed", err.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 👤 ZONE 1: CORE PROFILE IDENTITY DISPLAY CARD */}
        <View style={styles.profileBadgeCard}>
          <View style={styles.avatarGlowCircle}>
            <Text style={styles.avatarInitialLetter}>
              {displayIdentityName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileNameText}>{displayIdentityName}</Text>
          <Text style={styles.profileEmailText}>{userEmail}</Text>

          <TouchableOpacity
            style={[styles.verifiedSecurityBadge, { backgroundColor: privacyBadge.bg }]}
            onPress={() => router.push({ pathname: '/profile/edit' })}
          >
            <Ionicons name={privacyBadge.icon} size={14} color={privacyBadge.color} />
            <Text style={[styles.verifiedText, { color: privacyBadge.color }]}>{privacyBadge.text}</Text>
          </TouchableOpacity>

          <View style={styles.verificationPillRow}>
            {verificationPills.map((pill) => (
              <TouchableOpacity
                key={pill.key}
                style={[styles.verificationPill, pill.verified ? styles.verificationPillActive : styles.verificationPillInactive]}
                onPress={pill.onPress}
              >
                <Ionicons
                  name={pill.verified ? 'checkmark-circle' : 'ellipse-outline'}
                  size={13}
                  color={pill.verified ? '#137333' : '#94A3B8'}
                />
                <Text style={[styles.verificationPillText, { color: pill.verified ? '#137333' : '#94A3B8' }]}>
                  {pill.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.editProfileButton} onPress={() => router.push({ pathname: '/profile/edit' })}>
            <Ionicons name="create-outline" size={14} color={TagAlongColors.primary} />
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <ProfileReputationCard
          totalConnections={trust.total_connections}
          positiveSignals={trust.positive_signals}
          currentStreak={trust.current_streak}
          reputationState={trust.reputation_state}
        />

        {/* ⚙️ ZONE 2: ACCOUNT RULES & COMFORT PREFERENCES METRICS */}
        <Text style={styles.sectionHeaderTitle}>Comfort & Privacy</Text>
        <View style={styles.groupDeck}>
          <ProfileRowItem
            icon="shield-checkmark-outline"
            label="Default Match Preferences"
            value={trust.default_comfort_mode || 'Not set'}
            onPress={() => router.push({ pathname: '/profile/edit' })}
          />
          <ProfileRowItem
            icon="eye-off-outline"
            label="Anonymity Level"
            value={trust.anonymity_level === 'first_initial' ? 'First initial only' : 'First name'}
            onPress={() => router.push({ pathname: '/profile/edit' })}
          />
        </View>

        {/* 🛡️ ZONE 3: SAFETY INTEGRATIONS & COMPLIANCE MODES */}
        <Text style={styles.sectionHeaderTitle}>Safety Hub</Text>
        <View style={styles.groupDeck}>
          <ProfileRowItem
            icon="ban-outline"
            label="Blocked Connections"
            value={`${blockedCount} user${blockedCount === 1 ? '' : 's'}`}
            onPress={() => router.push('/safety/blocked-connections')}
          />
          <ProfileRowItem
            icon="document-text-outline"
            label="Community Guidelines"
            onPress={() => router.push('/safety/guidelines')}
          />
        </View>

        {isModerator && (
          <>
            <Text style={styles.sectionHeaderTitle}>Admin</Text>
            <View style={styles.groupDeck}>
              <ProfileRowItem
                icon="shield-outline"
                label="Moderator Tools"
                onPress={() => router.push('/admin/reports')}
              />
              <ProfileRowItem
                icon="id-card-outline"
                label="Verification Requests"
                onPress={() => router.push('/admin/verifications')}
              />
              <ProfileRowItem
                icon="git-compare-outline"
                label="Appeals"
                onPress={() => router.push('/admin/appeals')}
              />
              <ProfileRowItem
                icon="refresh-outline"
                label="Re-evaluations"
                onPress={() => router.push('/admin/reverifications')}
              />
            </View>
          </>
        )}

        {/* 🚪 ZONE 4: OPERATIONAL DESTRUCTIVE SESSIONS LEAVE ACTS */}
        <Text style={styles.sectionHeaderTitle}>Session Controls</Text>
        <View style={styles.groupDeck}>
          <ProfileRowItem
            icon="log-out-outline"
            label="Log out of account"
            isDestructive
            onPress={handleLogoutSequence}
          />
        </View>

        <Text style={styles.footerVersionStampText}>Tag Along v1.0.0 • Free Tier Cloud Storage</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 40,
  },
  profileBadgeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarGlowCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TagAlongColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarInitialLetter: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: TagAlongColors.textDark || '#1E293B',
    marginBottom: 4,
  },
  profileEmailText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 14,
  },
  verifiedSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F4EA',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#137333',
  },
  verificationPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  verificationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  verificationPillActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#137333',
  },
  verificationPillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  verificationPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
  },
  editProfileButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: TagAlongColors.primary,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  groupDeck: {
    marginBottom: 16,
  },
  footerVersionStampText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 20,
  },
});
