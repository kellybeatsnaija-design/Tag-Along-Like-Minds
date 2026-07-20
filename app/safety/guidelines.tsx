import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useUserStanding } from '../../hooks/use-user-standing';
import StandingBanner from '../../components/safety/StandingBanner';
import AppealModal from '../../components/safety/AppealModal';

const PROHIBITED_CONDUCT = [
  'Harassment, threats, or bullying',
  'Hate speech or discrimination',
  'Sharing someone else’s personal information without consent',
  'Sexual solicitation or unwanted sexual content',
  'Spam, scams, or fake profiles',
  'Impersonating another person',
  'Evading a ban or suspension with a new account',
];

const STRIKE_LADDER = [
  { title: 'Warning', desc: 'First confirmed violation. A record is kept, no restriction yet.' },
  { title: '24-hour restriction', desc: "Second confirmed violation. Can't create or join new sessions for 24 hours; existing chats still work." },
  { title: '7-day suspension', desc: 'Third confirmed violation. Core app features are unavailable for 7 days.' },
  { title: 'Permanent ban', desc: 'Fourth confirmed violation or a severe first offense. Access to Tag Along is permanently removed.' },
];

const REPUTATION_LADDER = [
  { title: 'New', desc: "Everyone starts here. No history yet — nothing negative about it." },
  { title: 'Verified', desc: 'You’ve confirmed at least one of email, community, or ID verification.' },
  { title: 'Reliable', desc: 'A solid track record of completed tag-alongs with positive feedback.' },
  { title: 'Trusted', desc: 'Strong history plus ID or community verification — the highest tier.' },
];

export default function SafetyGuidelinesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { standing, notice, refresh } = useUserStanding(user?.id);
  const [appealVisible, setAppealVisible] = useState(false);

  const canAppeal = standing !== 'active' && !!notice?.id;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TagAlongColors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Accountability</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StandingBanner standing={standing} notice={notice} onPressLearnMore={() => {}} />

        {canAppeal && (
          <TouchableOpacity style={styles.appealButton} onPress={() => setAppealVisible(true)}>
            <Ionicons name="git-compare-outline" size={16} color={TagAlongColors.primary} />
            <Text style={styles.appealButtonText}>Appeal this decision</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>How blocking & reporting work</Text>
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Blocking someone is one-directional and silent — they're never notified. Once blocked,
            you won't see their messages and you won't be matched with them again.
          </Text>
          <Text style={styles.bodyText}>
            Reporting sends details to our moderation team for review. You can report without
            blocking, block without reporting, or do both.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Prohibited conduct</Text>
        <View style={styles.card}>
          {PROHIBITED_CONDUCT.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bodyText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Enforcement ladder</Text>
        <View style={styles.card}>
          {STRIKE_LADDER.map((step, idx) => (
            <View key={step.title} style={styles.stepRow}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Appeals</Text>
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            If you believe a warning, restriction, suspension, or ban was a mistake, you can appeal it
            directly from this screen while the notice is active. A different moderator reviews your
            appeal and either upholds the original decision or overturns it — if overturned, your
            access is restored immediately, no further action needed on your part.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            <Text style={styles.inlineBold}>Email</Text> verifies automatically the moment you confirm the link
            we send at signup. <Text style={styles.inlineBold}>Community</Text> and <Text style={styles.inlineBold}>ID</Text> are
            submitted from your Profile and reviewed by a moderator before they're approved — they're
            not automatic. Verification never affects who you can match with; it only affects what
            reputation tiers you're eligible for. Community verification is periodically re-checked
            against your real activity and feedback, and can be revoked by a moderator if it declines.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Reputation</Text>
        <View style={styles.card}>
          {REPUTATION_LADDER.map((step) => (
            <View key={step.title} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bodyText}><Text style={styles.inlineBold}>{step.title}</Text> — {step.desc}</Text>
            </View>
          ))}
          <Text style={[styles.bodyText, { marginTop: 4 }]}>
            Your exact connection counts and feedback history are never shown to anyone but you —
            other people only ever see your tier label, never numbers, and never anything negative.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            From Edit Profile, you can show your name as just a first initial instead of your full first
            name, and hide your verification badges or reputation tier from other people entirely.
            These settings only change what others see — verification and reputation still work the
            same behind the scenes either way.
          </Text>
        </View>
      </ScrollView>

      <AppealModal
        visible={appealVisible}
        onClose={() => setAppealVisible(false)}
        moderationEventId={notice?.id ?? null}
        onSubmitted={refresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TagAlongColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TagAlongColors.textDark },
  scrollContent: { paddingBottom: 40 },
  appealButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: TagAlongColors.primary, borderRadius: 14, paddingVertical: 12, marginHorizontal: 20, marginTop: 14 },
  appealButtonText: { fontSize: 14, fontWeight: '700', color: TagAlongColors.primary },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginHorizontal: 20, marginBottom: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 20, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  bodyText: { fontSize: 14, color: '#475569', lineHeight: 20, flex: 1 },
  inlineBold: { fontWeight: '700', color: TagAlongColors.textDark },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { fontSize: 14, color: TagAlongColors.primary, lineHeight: 20 },
  stepRow: { flexDirection: 'row', gap: 12, paddingVertical: 6 },
  stepNumberCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: TagAlongColors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  stepTitle: { fontSize: 14, fontWeight: '700', color: TagAlongColors.textDark, marginBottom: 2 },
  stepDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },
});
