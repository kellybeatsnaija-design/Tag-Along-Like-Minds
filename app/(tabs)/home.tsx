import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.brandText}>Tag Along</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color={TagAlongColors.primary} />
        </TouchableOpacity>
      </View>

      {/* User Greeting Block */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greetingText}>Hi Augustine 👋</Text>
      </View>

      {/* Central Reassurance Card */}
      <View style={styles.emotionalCard}>
        <Text style={styles.cardPrompt}>Looking for your people?</Text>
        <Text style={styles.cardSubtext}>Find like-minded people for a safe online check-ins.</Text>
        
        {/* Placeholder for Core Branding Visual Illustration */}
        <View style={styles.illustrationWrapper}>
          <View style={styles.illustrationMock}>
            <Ionicons name="chatbubbles-outline" size={40} color={TagAlongColors.primary} style={{ marginRight: 8 }} />
            <Ionicons name="heart" size={20} color="#EF4444" style={{ marginHorizontal: 4 }} />
            <Ionicons name="headset-outline" size={40} color={TagAlongColors.textDark} style={{ marginLeft: 8 }} />
          </View>
        </View>

        {/* Dynamic Category Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badgeItem, styles.activeBadge]}>
            <View style={styles.dotIndicator} />
            <Text style={styles.activeBadgeText}>Low-pressure</Text>
          </View>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeText}>Supportive</Text>
          </View>
          <View style={styles.badgeItem}>
            <Text style={styles.badgeText}>Online only</Text>
          </View>
        </View>
      </View>

      {/* Primary Action Grouping */}
      <View style={styles.actionSection}>
        {/* Call to Action: Create Tag Along */}
        <TouchableOpacity 
          style={styles.primaryActionButton}
          onPress={() => router.push('/(tabs)/create-flow')}
        >
          <Text style={styles.primaryButtonText}>Create a tag-along</Text>
        </TouchableOpacity>

        {/* Secondary Action: Find Someone Now */}
        <TouchableOpacity 
          style={styles.listNavigationButton}
          onPress={() => router.push('/(tabs)/available')}
        >
          <View style={styles.listButtonLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#E2E8F0' }]}>
              <Ionicons name="search" size={20} color={TagAlongColors.primary} />
            </View>
            <Text style={styles.listButtonText}>Find someone now</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Secondary Action: Plan For Later */}
        <TouchableOpacity 
          style={styles.listNavigationButton}
          onPress={() => router.push('/(tabs)/create-flow')}
        >
          <View style={styles.listButtonLeft}>
            <View style={[styles.iconCircle, { backgroundColor: '#E2E8F0' }]}>
              <Ionicons name="calendar-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.listButtonText}>Plan for later</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TagAlongColors.background,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '700',
    color: TagAlongColors.primary,
  },
  iconButton: {
    padding: 4,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: TagAlongColors.textDark,
  },
  emotionalCard: {
    backgroundColor: TagAlongColors.cardBg,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 28,
  },
  cardPrompt: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  illustrationWrapper: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  illustrationMock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 60,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeItem: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: '#E0F2FE',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TagAlongColors.primary,
    marginRight: 6,
  },
  activeBadgeText: {
    fontSize: 12,
    color: TagAlongColors.primary,
    fontWeight: '600',
  },
  badgeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionSection: {
    gap: 14,
  },
  primaryActionButton: {
    backgroundColor: TagAlongColors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: TagAlongColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listNavigationButton: {
    backgroundColor: TagAlongColors.cardBg,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  listButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: TagAlongColors.textDark,
  },
});
