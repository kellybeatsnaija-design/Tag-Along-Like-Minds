import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { X } from 'lucide-react-native';
import { BRAND_COLORS } from '../constants/Colors';

interface InteractiveMapModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
}

export default function InteractiveMapModal({ visible, onClose, onConfirm }: InteractiveMapModalProps) {
  const [tempCoord, setTempCoord] = useState<{ latitude: number; longitude: number } | null>(null);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{ latitude: 6.4638, longitude: 3.6015, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          onPress={(e) => setTempCoord(e.nativeEvent.coordinate)}
        >
          {tempCoord && <Marker coordinate={tempCoord} pinColor={BRAND_COLORS.primary} />}
        </MapView>

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={22} color={BRAND_COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Pick location on map</Text>
        </View>

        <View style={styles.bottomCard}>
          <Text style={styles.cardHeader}>TARGET SELECTION POSITION</Text>
          <Text style={styles.cardDesc}>
            {tempCoord ? `Marker locked at target position` : "Tap firmly anywhere on the map layout to drop a marker pin."}
          </Text>
          <TouchableOpacity 
            style={[styles.confirmBtn, !tempCoord && styles.disabledBtn]}
            onPress={() => tempCoord && onConfirm(tempCoord)}
            disabled={!tempCoord}
          >
            <Text style={styles.confirmBtnText}>Confirm Selection Position</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  topBar: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 24, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  closeBtn: { backgroundColor: '#FFF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: BRAND_COLORS.textDark, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, overflow: 'hidden' },
  bottomCard: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 24, left: 16, right: 16, backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: BRAND_COLORS.borderLight },
  cardHeader: { fontSize: 11, fontWeight: '700', color: BRAND_COLORS.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: BRAND_COLORS.textDark, lineHeight: 18, marginBottom: 16, fontWeight: '500' },
  confirmBtn: { backgroundColor: BRAND_COLORS.primary, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { backgroundColor: '#D4E2DC', opacity: 0.8 },
  confirmBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});
