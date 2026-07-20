import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';
// import { fetchSocialProofStats } from '../../app/(tabs)/home'; // Adjust path if function is stored elsewhere
// ✅ ADD THIS LINE INSTEAD (Adjust relative dots depending on your exact folder depth):
import { fetchSocialProofStats } from '../../config/queries';


interface SocialMomentumTickerProps {
  onTapSuggestion: (text: string) => void;
}

type LiveLobby = {
  id: string;
  intent_text: string;
  social_mood: string;
  connection_mode: string;
};

export default function SocialMomentumTicker({ onTapSuggestion }: SocialMomentumTickerProps) {
  const [liveCount, setLiveCount] = useState(14); // High-utility fallback number if database is empty
  const [activeFeeds, setActiveFeeds] = useState<LiveLobby[]>([
    { id: 'm1', intent_text: 'Reading sci-fi together silently', social_mood: 'Quiet company', connection_mode: 'chat' },
    { id: 'm2', intent_text: 'Javascript interview prep cram session', social_mood: 'Focused', connection_mode: 'call' },
    { id: 'm3', intent_text: 'Just sipping coffee and venting', social_mood: 'Supportive', connection_mode: 'call' }
  ]);

  useEffect(() => {
    // Poll the cloud database every 30 seconds to keep momentum statistics fresh
    const loadRealTimeMomentum = async () => {
      const stats = await fetchSocialProofStats();
      if (stats.activeCount > 0) setLiveCount(stats.activeCount);
      if (stats.recentLobbies.length > 0) {
        setActiveFeeds(stats.recentLobbies.map((item: any) => ({
          id: item.id,
          intent_text: item.intent_text,
          social_mood: item.social_mood,
          connection_mode: item.connection_mode
        })));
      }
    };

    loadRealTimeMomentum();
    const pollingInterval = setInterval(loadRealTimeMomentum, 30000);
    return () => clearInterval(pollingInterval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Real-time Global Activity Tracker Badge */}
      <View style={styles.activityPulseBadge}>
        <View style={styles.greenPulseDot} />
        <Text style={styles.pulseText}>
          {liveCount} online users nearby
        </Text>
      </View>

      <Text style={styles.sectionHeaderTitle}>Trending tags Nearby </Text>

      {/* Horizontal Rolling Carousel of Active Streams */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.carouselContainer}
      >
        {activeFeeds.map((lobby) => (
          <TouchableOpacity 
            key={lobby.id} 
            style={styles.lobbyCard}
            onPress={() => onTapSuggestion(lobby.intent_text)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.moodBadge}>
                <Text style={styles.moodBadgeText}>{lobby.social_mood}</Text>
              </View>
              <Ionicons 
                name={lobby.connection_mode === 'chat' ? 'chatbubbles-outline' : 'call-outline'}
                size={14} 
                color="#64748B" 
              />
            </View>
            
            <Text style={styles.intentPreviewText} numberOfLines={2}>
              "{lobby.intent_text}"
            </Text>
            
            <Text style={styles.joinActionPromptText}>Tap to match energy →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginVertical: 20, paddingHorizontal: 4 },
  activityPulseBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: '#E6F4EA', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, marginBottom: 18 },
  greenPulseDot: { width: 8 , height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
  pulseText: { fontSize: 13, fontWeight: '600', color: '#137333' },
  sectionHeaderTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingLeft: 2 },
  carouselContainer: { gap: 12, paddingBottom: 4 },
  lobbyCard: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 18, width: 200, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  moodBadge: { backgroundColor: '#F1F5F9', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  moodBadgeText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  intentPreviewText: { fontSize: 13, fontWeight: '600', color: '#1E293B', lineHeight: 18, height: 36 },
  joinActionPromptText: { fontSize: 11, fontWeight: '700', color: TagAlongColors.primary, marginTop: 8 }
});
