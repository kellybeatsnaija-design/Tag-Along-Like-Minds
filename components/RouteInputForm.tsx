import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin, Map as MapIcon, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import { BRAND_COLORS } from '../constants/Colors';

interface RouteInputFormProps {
  origin: string;
  destination: string;
  setOrigin: (text: string) => void;
  setDestination: (text: string) => void;
  onOpenMap: (field: 'origin' | 'destination') => void;
}

export default function RouteInputForm({ origin, destination, setOrigin, setDestination, onOpenMap }: RouteInputFormProps) {
  const [loadingGPS, setLoadingGPS] = useState(false);

  const fetchLiveGPSLocation = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const reverse = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        if (reverse.length > 0) {
          setOrigin(reverse[0].street || reverse[0].district || "Current Location");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGPS(false);
    }
  };

  useEffect(() => {
    fetchLiveGPSLocation(); // Auto-fetches GPS instantly on creation form mount
  }, []);

  return (
    <View style={styles.formCardCanvas}>
      <Text style={styles.cardHeader}>ROUTE DETAIL COORDINATES</Text>
      
      <View style={styles.inputWrapper}>
        <MapPin size={20} color={BRAND_COLORS.primary} style={styles.icon} />
        <TextInput style={styles.input} placeholder="Search pickup point..." placeholderTextColor="#999" value={origin} onChangeText={setOrigin} />
        <TouchableOpacity onPress={fetchLiveGPSLocation} style={styles.actionBtn}>
          {loadingGPS ? <ActivityIndicator size="small" color={BRAND_COLORS.primary} /> : <Navigation size={16} color={BRAND_COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <View style={styles.dottedLine} />

      <View style={styles.inputWrapper}>
        <MapPin size={20} color="#E65100" style={styles.icon} />
        <TextInput style={styles.input} placeholder="Search drop-off point..." placeholderTextColor="#999" value={destination} onChangeText={setDestination} />
        <TouchableOpacity onPress={() => onOpenMap('destination')} style={styles.actionBtn}>
          <MapIcon size={18} color="#E65100" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formCardCanvas: { backgroundColor: BRAND_COLORS.cardWhite, borderRadius: 20, padding: 18, width: '100%', borderWidth: 1, borderColor: BRAND_COLORS.borderLight },
  cardHeader: { fontSize: 12, fontWeight: '700', color: BRAND_COLORS.textDark, letterSpacing: 1, marginBottom: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5FAF6', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, borderRadius: 14, paddingHorizontal: 14, height: 54 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 14, color: BRAND_COLORS.textDark, fontWeight: '600', height: '100%' },
  actionBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#EDF4F0', marginLeft: 4 },
  dottedLine: { width: 2, height: 14, backgroundColor: BRAND_COLORS.borderLight, marginLeft: 23, marginVertical: 4 }
});
