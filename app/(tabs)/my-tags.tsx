import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';

const MOCK_USER_TAGS = [
  {
    id: '1',
    status: 'Active',
    title: 'Low-pressure chat with Maya',
    badgeStatus: 'Active now',
    statusColor: '#EF4444',
    tags: ['Just vibes', 'Chat only', '✓ Verified'],
    actionText: 'Rejoin',
    actionColor: TagAlongColors.primary,
  },
  {
    id: '2',
    status: 'Upcoming',
    title: 'Career prep with Daniel',
    badgeStatus: 'Today, 7:00 PM',
    statusColor: '#64748B',
    tags: ['Online meeting', 'Structured'],
    actionText: 'View details',
    actionColor: '#A78BFA',
  },
  {
    id: '3',
    status: 'Completed',
    title: 'Language practice with Ari',
    badgeStatus: 'Completed',
    statusColor: '#64748B',
    tags: ['Voice call', 'Supportive'],
    actionText: 'Give feedback',
    actionColor: '#A78BFA',
  }
];

export default function MyTagsScreen() {
  const router = useRouter();
  const [selectedSegment, setSelectedSegment] = useState<'Active' | 'Upcoming' | 'Completed'>('Active');

  // Filter sessions matching selected segment parameters
  const filteredTags = MOCK_USER_TAGS.filter(tag => tag.status === selectedSegment);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Branding Row */}
        <View style={styles.headerBlock}>
          <Text style={styles.titleText}>My Tags</Text>
          <Text style={styles.subtitleText}>
            Your active, upcoming, and completed online connections.
          </Text>
        </View>

        {/* Segmented Top Nav Controller Deck */}
        <View style={styles.segmentControlRow}>
          {(['Active', 'Upcoming', 'Completed'] as const).map((segment) => {
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
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => (
              <View key={tag.id} style={styles.tagCard}>
                <View style={styles.cardInfoRow}>
                  <View style={styles.textGroup}>
                    <Text style={styles.cardTitle}>{tag.title}</Text>
                    <View style={styles.statusBadgeRow}>
                      <View style={[styles.statusDot, { backgroundColor: tag.statusColor }]} />
                      <Text style={styles.statusBadgeText}>{tag.badgeStatus}</Text>
                    </View>
                  </View>
                  <View style={styles.avatarMockCircle}>
                    <Ionicons name="person-outline" size={20} color="#94A3B8" />
                  </View>
                </View>

                {/* Sub-badge Meta Matrix */}
                <View style={styles.metaBadgeMatrix}>
                  {tag.tags.map((meta, idx) => (
                    <View key={idx} style={styles.metaBadgeItem}>
                      <Text style={styles.metaBadgeItemText}>{meta}</Text>
                    </View>
                  ))}
                </View>

                {/* Primary Card Operational Button */}
                <TouchableOpacity 
                  style={[styles.cardActionButton, { backgroundColor: tag.actionColor }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardActionButtonText}>{tag.actionText}</Text>
                </TouchableOpacity>
              </View>
            ))
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
