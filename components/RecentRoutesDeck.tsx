import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { History, Star } from 'lucide-react-native';
import { BRAND_COLORS } from '../constants/Colors';

interface CachedRoute {
  id: string;
  origin: string;
  destination: string;
  isFrequent?: boolean;
}

interface RecentRoutesDeckProps {
  onSelectRoute: (origin: string, destination: string) => void;
}

export default function RecentRoutesDeck({ onSelectRoute }: RecentRoutesDeckProps) {
  const cachedRoutes: CachedRoute[] = [
    { id: 'cr-1', origin: 'Lekki Phase 1 Gate', destination: 'Chevron Corporate Hub', isFrequent: true },
    { id: 'cr-2', origin: 'Ajah Roundabout', destination: 'Victoria Island (Civic Center)', isFrequent: true },
  ];

  return (
    <View style={styles.cardCanvas}>
      <View style={styles.headerRow}>
        <History size={16} color={BRAND_COLORS.textMuted} />
        <Text style={styles.headerTitle}>RECENT & FREQUENT PATHS</Text>
      </View>
      <View style={styles.listContainer}>
        {cachedRoutes.map((route) => (
          <TouchableOpacity 
            key={route.id}
            style={styles.rowItem}
            onPress={() => onSelectRoute(route.origin, route.destination)}
            activeOpacity={0.7}
          >
            <Star size={14} color="#FFB800" fill={route.isFrequent ? "#FFB800" : "transparent"} />
            <Text style={styles.lineText} numberOfLines={1}>{route.origin} → {route.destination}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardCanvas: { backgroundColor: BRAND_COLORS.cardWhite, borderRadius: 20, padding: 18, width: '100%', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, marginTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  headerTitle: { fontSize: 12, fontWeight: '700', color: BRAND_COLORS.textDark, letterSpacing: 1 },
  listContainer: { gap: 8 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#F9FBF9', borderRadius: 10, borderWidth: 1, borderColor: '#EDF4F0' },
  lineText: { fontSize: 13, fontWeight: '600', color: BRAND_COLORS.textDark, flex: 1 }
});
