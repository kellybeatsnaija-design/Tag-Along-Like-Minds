import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../../constants/Colors';

interface HomeHeaderProps {
  hasActiveIntent: boolean;
  onResetSession: () => void;
  unreadCount?: number;
  onPressNotifications?: () => void;
}

export default function HomeHeader({ hasActiveIntent, onResetSession, unreadCount = 0, onPressNotifications }: HomeHeaderProps) {
  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.headerTitle}>Tag Along</Text>
        <Text style={styles.headerStatusSubtext}>• Cloud database sync live</Text>
      </View>
      <View style={styles.headerActionsRow}>
        <TouchableOpacity style={styles.bellButton} onPress={onPressNotifications} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={TagAlongColors.textDark || '#1E293B'} />
          {unreadCount > 0 && <View style={styles.unreadDot} />}
        </TouchableOpacity>
        {hasActiveIntent && (
          <TouchableOpacity style={styles.newSessionBtn} onPress={onResetSession} activeOpacity={0.7}>
            <Ionicons name="add" size={16} color="#EF4444" />
            <Text style={styles.newSessionText}>New Stream</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: TagAlongColors.primary },
  headerStatusSubtext: { fontSize: 11, fontWeight: '600', color: '#10B981', marginTop: 2 },
  headerActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellButton: { padding: 4 },
  unreadDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  newSessionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14 },
  newSessionText: { fontSize: 13, color: '#EF4444', fontWeight: '700', marginLeft: 2 },
});
