import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ModerationNotice } from '../../hooks/use-user-standing';

interface StandingBannerProps {
  standing: string;
  notice: ModerationNotice | null;
  onPressLearnMore: () => void;
}

const STANDING_COPY: Record<string, { title: string; color: string; bg: string }> = {
  restricted: { title: "You're temporarily restricted", color: '#92400E', bg: '#FEF3C7' },
  suspended: { title: 'Your account is suspended', color: '#991B1B', bg: '#FEE2E2' },
  banned: { title: 'Your account has been banned', color: '#FFFFFF', bg: '#991B1B' },
};

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return '';
  const date = new Date(expiresAt);
  if (date.getTime() < Date.now()) return '';
  return ` until ${date.toLocaleString()}`;
}

export default function StandingBanner({ standing, notice, onPressLearnMore }: StandingBannerProps) {
  if (standing === 'active') return null;
  const copy = STANDING_COPY[standing] || STANDING_COPY.restricted;

  return (
    <TouchableOpacity style={[styles.banner, { backgroundColor: copy.bg }]} onPress={onPressLearnMore} activeOpacity={0.8}>
      <Ionicons name="warning" size={18} color={copy.color} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: copy.color }]}>
          {copy.title}{notice ? formatExpiry(notice.expires_at) : ''}
        </Text>
        {notice?.reason && (
          <Text style={[styles.reason, { color: copy.color }]} numberOfLines={2}>{notice.reason}</Text>
        )}
        <Text style={[styles.link, { color: copy.color }]}>Learn more</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
  },
  title: { fontSize: 14, fontWeight: '700' },
  reason: { fontSize: 12, fontWeight: '500', marginTop: 2, opacity: 0.9 },
  link: { fontSize: 12, fontWeight: '700', marginTop: 6, textDecorationLine: 'underline' },
});
