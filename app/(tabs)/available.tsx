import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';

const FILTER_TAGS = [
  'Chat only', 'Voice', 'Online meeting', 'Low-pressure', 'Career prep', 'Just vibes', 'Starting soon'
];

const MOCK_SESSIONS = [
  {
    id: '1',
    title: 'Low-pressure chat for just vibes',
    host: 'Maya',
    time: 'Starting now',
    badges: [
      { text: 'Chat only', type: 'primary' },
      { text: '1 person needed', type: 'neutral' },
      { text: '92% fit', type: 'match' },
      { text: '✓ Verified host', type: 'verified' }
    ],
    actionText: 'Request to join'
  },
  {
    id: '2',
    title: 'Career prep accountability session',
    host: 'Daniel',
    time: 'Today, 7:00 PM',
    badges: [
      { text: 'Online meeting', type: 'secondary' },
      { text: 'Structured', type: 'neutral' },
      { text: '2 spots left', type: 'alert' }
    ],
    actionText: 'View details'
  },
  {
    id: '3',
    title: 'Coding study buddy session',
    host: 'Ari',
    time: 'Open now',
    badges: [
      { text: 'Voice okay', type: 'primary' },
      { text: 'Focused', type: 'neutral' },
      { text: '1 spot left', type: 'alert' }
    ],
    actionText: 'Request to join'
  }
];

export default function AvailableScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  return (
    <View style={styles.container}>
      {/* Scrollable Main Content Stream */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Core Header Section */}
        <View style={styles.headerBlock}>
          <Text style={styles.titleText}>Available Tag-Alongs</Text>
          <Text style={styles.subtitleText}>
            Join sessions created by people who want the same kind of online company.
          </Text>
        </View>

        {/* Dynamic Search Bar Interface */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by interest, mood, or session type"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Horizontal Scrolling Filter Deck */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterDeckScroll}
          contentContainerStyle={styles.filterDeckContent}
        >
          {FILTER_TAGS.map((tag) => {
            const isSelected = activeFilter === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.filterChip, isSelected && styles.activeFilterChip]}
                onPress={() => setActiveFilter(isSelected ? '' : tag)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.activeFilterChipText]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Session Card Target Render Deck */}
        <View style={styles.cardDeckContainer}>
          {MOCK_SESSIONS.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.cardHeaderRow}>
                {/* Simulated Rounded User Icon Placeholder */}
                <View style={styles.profileAvatarMock}>
                  <Ionicons name="person" size={20} color="#94A3B8" />
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={styles.hostSubtext}>By {session.host} • {session.time}</Text>
                </View>
              </View>

              {/* Functional Badge Matrix Row */}
              <View style={styles.badgeMatrixRow}>
                {session.badges.map((badge, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.badgeItem, 
                      badge.type === 'primary' && styles.badgePrimary,
                      badge.type === 'secondary' && styles.badgeSecondary,
                      badge.type === 'match' && styles.badgeMatch,
                      badge.type === 'verified' && styles.badgeVerified,
                      badge.type === 'alert' && styles.badgeAlert,
                    ]}
                  >
                    <Text 
                      style={[
                        styles.badgeItemText,
                        badge.type === 'primary' && styles.badgeTextPrimary,
                        badge.type === 'secondary' && styles.badgeTextSecondary,
                        badge.type === 'match' && styles.badgeTextMatch,
                        badge.type === 'verified' && styles.badgeTextVerified,
                        badge.type === 'alert' && styles.badgeTextAlert,
                      ]}
                    >
                      {badge.text}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Trigger Button */}
              <TouchableOpacity 
                style={[
                  styles.cardActionButton, 
                  session.actionText === 'View details' ? styles.btnAltStyle : styles.btnPrimaryStyle
                ]}
                activeOpacity={0.8}
              >
                <Text 
                  style={[
                    styles.cardActionText, 
                    session.actionText === 'View details' ? styles.txtAltStyle : styles.txtPrimaryStyle
                  ]}
                >
                  {session.actionText}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Secondary Alternative Action Blueprint */}
        <TouchableOpacity style={styles.createOwnButton} activeOpacity={0.8}>
          <Text style={styles.createOwnButtonText}>Create your own</Text>
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
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignDirection: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TagAlongColors.textDark,
  },
  filterDeckScroll: {
    marginBottom: 24,
    marginHorizontal: -24,
  },
  filterDeckContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  activeFilterChip: {
    backgroundColor: TagAlongColors.primary,
    borderColor: TagAlongColors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardDeckContainer: {
    gap: 16,
    marginBottom: 24,
  },
  sessionCard: {
    backgroundColor: TagAlongColors.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  profileAvatarMock: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TagAlongColors.textDark,
    marginBottom: 4,
    lineHeight: 22,
  },
  hostSubtext: {
    fontSize: 13,
    color: '#64748B',
  },
  badgeMatrixRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  badgeItem: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  badgeItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  badgePrimary: { backgroundColor: '#E0F2FE' },
  badgeTextPrimary: { color: '#0369A1' },
  badgeSecondary: { backgroundColor: '#F3E8FF' },
  badgeTextSecondary: { color: '#6D28D9' },
  badgeMatch: { backgroundColor: '#DCFCE7' },
  badgeTextMatch: { color: '#15803D', fontWeight: '700' },
  badgeVerified: { backgroundColor: '#FEF3C7' },
  badgeTextVerified: { color: '#B45309' },
  badgeAlert: { backgroundColor: '#FFEDD5' },
  badgeTextAlert: { color: '#C2410C' },
  cardActionButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryStyle: {
    backgroundColor: '#A78BFA', // Soft layout purple color match
  },
  btnAltStyle: {
    backgroundColor: '#E2E8F0',
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  txtPrimaryStyle: { color: '#FFFFFF' },
  txtAltStyle: { color: TagAlongColors.textDark },
  createOwnButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createOwnButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: TagAlongColors.textDark,
  },
  });
  
  
  