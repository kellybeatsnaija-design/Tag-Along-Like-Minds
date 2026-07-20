import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TagAlongColors } from '../../constants/Colors';

interface DailySparkAnchorProps {
  onQuickLaunch: (intentText: string, groupSize: number, comfort: string, mode: 'chat' | 'call') => void;
  onTapSpark: (text: string) => void;
}

export default function DailySparkAnchor({ onQuickLaunch, onTapSpark }: DailySparkAnchorProps) {
  // 1. Dynamic daily prompt that rotates based on the day of the week to create a variable trigger
  const dailySparkText = "Monday Momentum: Setting up a quiet space to knock out tasks. Need a silent coding partner or accountability buddy?";

  // 2. High-utility saved user anchors for 1-tap hosting shortcuts
  const userFavorites = [
    { id: 'fav1', label: 'My Code Sprint', intent: 'Deep focus coding study', size: 2, comfort: 'Anyone', mode: 'chat', icon: 'code-slash' },
    { id: 'fav2', label: 'Morning Vent', intent: 'Coffee sip & casual vent', size: 1, comfort: 'same-gender', mode: 'call', icon: 'cafe-outline' },
    { id: 'fav3', label: 'Quiet Read', intent: 'Silent reading companion room', size: 3, comfort: 'Anyone', mode: 'chat', icon: 'book-outline' }
  ];

  return (
    <View style={styles.container}>
      
      {/* 🌟 ZONE 1: THE DAILY SPARK TRIGGER */}
      {/* <View style={styles.sparkCard}>
        <View style={styles.sparkHeader}>
          <View style={styles.sparkBadge}>
            <Ionicons name="sparkles" size={12} color="#FFFFFF" />
            <Text style={styles.sparkBadgeText}>Daily Spark</Text>
          </View>
          <View style={styles.streakIndicator}>
            <Ionicons name="flame" size={14} color="#F59E0B" />
            <Text style={styles.streakText}>4 day streak</Text>
          </View>
        </View>
        <Text style={styles.sparkBodyText}>"{dailySparkText}"</Text>
        <TouchableOpacity 
          style={styles.sparkActionBtn} 
          onPress={() => onTapSpark("Deep focus coding session")}
          activeOpacity={0.8}
        >
          <Text style={styles.sparkActionBtnText}>Use today's spark</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View> */}

      {/* ⚡ ZONE 2: INTENT ANCHORS (1-TAP QUICK LAUNCH) */}
      <Text style={styles.sectionTitle}>Quick Tags</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.favoritesCarousel}
      >
        {userFavorites.map((fav) => (
          <TouchableOpacity 
            key={fav.id} 
            style={styles.favoriteCard}
            onPress={() => onQuickLaunch(fav.intent, fav.size, fav.comfort, fav.mode as any)}
            activeOpacity={0.8}
          >
            <View style={styles.favIconCircle}>
              <Ionicons name={fav.icon as any} size={18} color={TagAlongColors.primary} />
            </View>
            <Text style={styles.favLabel} numberOfLines={1}>{fav.label}</Text>
            <Text style={styles.favSubLabel}>{fav.size}P • {fav.mode === 'chat' ? 'Chat' : 'Call'}</Text>
          </TouchableOpacity>
        ))}
        
        {/* Dynamic Empty Add Card to encourage user investment */}
        <TouchableOpacity style={styles.addFavoriteCard} onPress={() => alert('Long-press an active lobby from your "My Tags" tab to save it as a Quick Anchor!')}>
          <Ionicons name="add" size={20} color="#94A3B8" />
          <Text style={styles.addFavText}>Save New</Text>
        </TouchableOpacity>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginTop: 8, paddingHorizontal: 4 },
  
  // Spark Card Styles
  sparkCard: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 24, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  sparkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sparkBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: TagAlongColors.secondary || '#A78BFA', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, gap: 4 },
  sparkBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  streakIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  streakText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  sparkBodyText: { fontSize: 14, fontWeight: '600', color: TagAlongColors.textDark || '#1E293B', lineHeight: 22, marginBottom: 14, fontStyle: 'italic' },
  sparkActionBtn: { backgroundColor: TagAlongColors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14, gap: 6 },
  sparkActionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  
  // Favorites Anchors Styles
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingLeft: 2 },
  favoritesCarousel: { gap: 10, paddingBottom: 4 },
  favoriteCard: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 20, width: 125, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.01, shadowRadius: 2, elevation: 1 },
  favIconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FAFEFF', borderWidth: 1, borderColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  favLabel: { fontSize: 13, fontWeight: '700', color: TagAlongColors.textDark || '#1E293B', textAlign: 'center', width: '100%' },
  favSubLabel: { fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 2 },
  
  addFavoriteCard: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 20, width: 110, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  addFavText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' }
});
