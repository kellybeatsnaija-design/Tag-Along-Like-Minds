import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { AlertCircle, RefreshCw, Users, Bell, Building, Compass, GraduationCap } from 'lucide-react-native';
import { BRAND_COLORS } from '../constants/Colors';

interface CommunityPreset {
  id: string;
  title: string;
  type: 'estate' | 'workplace' | 'campus';
  members: number;
  imageUrl: string;
}

interface NoMatchesHubProps {
  onBroadenTime: () => void;
  onExpandVisibility: () => void;
  onActivateNotifications: () => void;
}

export default function NoMatchesHub({ onBroadenTime, onExpandVisibility, onActivateNotifications }: NoMatchesHubProps) {
  const nearCommunities: CommunityPreset[] = [
    { id: 'cm-101', title: 'Lekki Phase 1 Estate Pool', type: 'estate', members: 650, imageUrl: 'https://unsplash.com' },
    { id: 'cm-102', title: 'Chevron Corporate Drive Hub', type: 'workplace', members: 480, imageUrl: 'https://unsplash.com' },
    { id: 'cm-103', title: 'Pan-Atlantic Campus Net', type: 'campus', members: 320, imageUrl: 'https://unsplash.com' }
  ];

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Core Warning microcopy panel */}
      <View style={styles.centerAlertCard}>
        <AlertCircle size={56} color="#E65100" style={{ marginBottom: 12 }} />
        <Text style={styles.radarMainTitle}>No exact match right now</Text>
        <Text style={styles.radarSubParagraph}>
          No one from your precise network path overlaps with this hour window. Tweak parameters or explore your active local communities below.
        </Text>
      </View>

      {/* BLOCK 1: ADJUST ROUTE PARAMETERS */}
      <View style={styles.blockCardCanvas}>
        <Text style={styles.blockSectionHeaderTitle}>ADJUST ROUTE PARAMETERS</Text>
        
        <TouchableOpacity style={styles.fallbackRowBtn} onPress={onBroadenTime}>
          <RefreshCw size={14} color={BRAND_COLORS.primaryDark} style={{ marginRight: 8 }} />
          <Text style={styles.fallbackRowBtnText}>Broaden travel window (+30 mins)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fallbackRowBtn} onPress={onExpandVisibility}>
          <Users size={14} color={BRAND_COLORS.primaryDark} style={{ marginRight: 8 }} />
          <Text style={styles.fallbackRowBtnText}>Expand visibility beyond Estate</Text>
        </TouchableOpacity>
      </View>

      {/* BLOCK 2: HORIZONTAL COMMUNITIES CAROUSEL */}
      <View style={styles.blockCardCanvas}>
        <Text style={styles.blockSectionHeaderTitle}>ACTIVE COMMUNITIES NEAR YOU</Text>
        <Text style={styles.blockHeaderSubtext}>Tap a nearby group network hub to join their channel loop or check general rides.</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainerSpacing}>
          {nearCommunities.map((community) => (
            <View key={community.id} style={styles.communityThumbnailCard}>
              <Image source={{ uri: community.imageUrl }} style={styles.communityCardImage} />
              <View style={styles.communityCardContent}>
                <Text style={styles.communityCardTitle} numberOfLines={1}>{community.title}</Text>
                <Text style={styles.communityCardMeta}>{community.members} Active Members</Text>
                
                <View style={styles.typeBadgeFloatingIcon}>
                  {community.type === 'estate' && <Building size={14} color={BRAND_COLORS.primaryDark} />}
                  {community.type === 'workplace' && <Compass size={14} color={BRAND_COLORS.primaryDark} />}
                  {community.type === 'campus' && <GraduationCap size={14} color={BRAND_COLORS.primaryDark} />}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* BLOCK 3: BACKGROUND NOTIFICATION ACTIONS */}
      <View style={styles.blockCardCanvas}>
        <Text style={styles.blockSectionHeaderTitle}>AUTOMATED ASYNC BACKGROUND SCANNING</Text>
        <Text style={styles.blockHeaderSubtext}>Save this path intent securely. Tag Along will background-scan and alert your phone when a match inserts.</Text>
        
        <TouchableOpacity style={styles.adjustSearchActionBtn} onPress={onActivateNotifications} activeOpacity={0.8}>
          <Bell size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.adjustSearchActionText}>Notify me when someone appears</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  scrollContent: { paddingVertical: 10, paddingBottom: 40 },
  centerAlertCard: { alignItems: 'center', width: '100%', marginBottom: 10, paddingHorizontal: 12 },
  radarMainTitle: { fontSize: 22, fontWeight: '800', color: BRAND_COLORS.textDark, textAlign: 'center', letterSpacing: -0.5 },
  radarSubParagraph: { fontSize: 14, color: BRAND_COLORS.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22, fontWeight: '500' },
  blockCardCanvas: { backgroundColor: BRAND_COLORS.cardWhite, borderRadius: 20, padding: 18, width: '100%', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, marginTop: 16 },
  blockSectionHeaderTitle: { fontSize: 11, fontWeight: '700', color: BRAND_COLORS.textDark, letterSpacing: 1.5, marginBottom: 4 },
  blockHeaderSubtext: { fontSize: 13, color: BRAND_COLORS.textMuted, fontWeight: '500', lineHeight: 18, marginBottom: 14 },
  fallbackRowBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 48, backgroundColor: '#F5FAF6', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, borderRadius: 12, marginTop: 10, width: '100%' },
  fallbackRowBtnText: { fontSize: 14, fontWeight: '700', color: BRAND_COLORS.primaryDark },
  carouselContainerSpacing: { gap: 12, paddingVertical: 4 },
  communityThumbnailCard: { backgroundColor: '#FFF', width: 170, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BRAND_COLORS.borderLight },
  communityCardImage: { width: '100%', height: 95, backgroundColor: '#EEE' },
  communityCardContent: { padding: 12, position: 'relative' },
  communityCardTitle: { fontSize: 13, fontWeight: '700', color: BRAND_COLORS.textDark, paddingRight: 16 },
  communityCardMeta: { fontSize: 11, color: BRAND_COLORS.textMuted, marginTop: 4, fontWeight: '600' },
  typeBadgeFloatingIcon: { position: 'absolute', top: 12, right: 12, backgroundColor: BRAND_COLORS.primaryLight, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  adjustSearchActionBtn: { backgroundColor: BRAND_COLORS.primary, height: 54, borderRadius: 27, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  adjustSearchActionText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});
