import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, FlatList, Image, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Users, UsersRound } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import { BRAND_COLORS } from '../../constants/Colors';

interface CommunityCard {
  id: string;
  title: string;
  members: number;
  imageUrl: string;
}

export default function PerfectCommunitySetupScreen() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const [contactsGranted, setContactsGranted] = useState(false);

  // High-fidelity local data array for your horizontal slider
  const localCommunities: CommunityCard[] = [
    {
      id: 'c1',
      title: 'Lekki Estate',
      members: 650,
      imageUrl: 'https://unsplash.com',
    },
    {
      id: 'c2',
      title: 'Victoria Island Professionals',
      members: 480,
      imageUrl: 'https://unsplash.com',
    },
    {
      id: 'c3',
      title: 'Coworking Circle',
      members: 320,
      imageUrl: 'https://unsplash.com',
    },
  ];

  const handleAllowLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationGranted(true);
        Alert.alert('Success', 'Nearby communities unlocked based on your current location!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllowContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        setContactsGranted(true);
        Alert.alert('Success', 'Contacts synced! Showing matches you already know.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderCommunityCard = ({ item }: { item: CommunityCard }) => (
    <View style={styles.communityCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.members} Members • Trusted</Text>
        <View style={styles.cardBadge}>
          <MapPin size={12} color="#FFF" fill={BRAND_COLORS.primary} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Fixed Sticky Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backTouch}>
          <ArrowLeft size={24} color={BRAND_COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Find your trusted network</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainSubtitle}>Join nearby communities and connect with people you already know.</Text>

        {/* 1. COMMUNITIES CARD BLOCK */}
        <View style={styles.blockCard}>
          <View style={styles.blockHeaderRow}>
            <MapPin size={22} color={BRAND_COLORS.primary} fill={BRAND_COLORS.primaryLight} />
            <Text style={styles.blockHeaderTitle}>Communities around you</Text>
          </View>
          <Text style={styles.blockDescription}>
            Use your location to discover estates, workplaces, campuses, churches, and groups nearby.
          </Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, locationGranted && styles.disabledButton]} 
            onPress={handleAllowLocation}
            disabled={locationGranted}
          >
            <Text style={styles.actionButtonText}>{locationGranted ? "Location Active" : "Allow location"}</Text>
          </TouchableOpacity>
          <TouchableOpacity><Text style={styles.textLink}>Enter location manually</Text></TouchableOpacity>
        </View>

        {/* HORIZONTAL CAROUSEL */}
        <FlatList
          data={localCommunities}
          renderItem={renderCommunityCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselSpacing}
        />

        {/* 2. CONTACTS CARD BLOCK */}
        <View style={styles.blockCard}>
          <View style={styles.blockHeaderRow}>
            <UsersRound size={22} color={BRAND_COLORS.primary} />
            <Text style={styles.blockHeaderTitle}>People you may know</Text>
          </View>
          <Text style={styles.blockDescription}>See which contacts are already using Tag Along.</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, contactsGranted && styles.disabledButton]} 
            onPress={handleAllowContacts}
            disabled={contactsGranted}
          >
            <Text style={styles.actionButtonText}>{contactsGranted ? "Contacts Synced" : "Allow contacts"}</Text>
          </TouchableOpacity>
          <Text style={styles.footnote}>We only use contacts to help you find familiar people.</Text>
        </View>

        {/* 3. INVITE CODE BLOCK */}
        <View style={styles.blockCard}>
          <Text style={styles.inlineCardTitle}>Have an invite code?</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter code"
              placeholderTextColor="#999"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.inlineJoinButton}>
              <Text style={styles.inlineJoinButtonText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GLOBAL ACTION BUTTONS */}
        <View style={styles.footerBlock}>
          <TouchableOpacity 
            style={styles.globalContinueButton}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.globalButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.textLinkSecondary}>Continue with limited access</Text>
          </TouchableOpacity>

          <View style={styles.dividerLine} />
          <Text style={styles.bottomDisclaimer}>Communities improve trust and match quality.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFDF9' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#F5F5F2', backgroundColor: '#FFF', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  backTouch: { padding: 4, marginRight: 12 },
  topBarTitle: { fontSize: 22, fontWeight: '700', color: BRAND_COLORS.textDark, letterSpacing: -0.5 },
  
  scrollContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 50 },
  mainSubtitle: { fontSize: 15, color: BRAND_COLORS.textMuted, lineHeight: 22, fontWeight: '500', marginBottom: 20 },
  
  // Wireframe Block Cards
  blockCard: { backgroundColor: BRAND_COLORS.cardWhite, borderRadius: 16, padding: 18, width: '100%', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, marginBottom: 16 },
  blockHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  blockHeaderTitle: { fontSize: 16, fontWeight: '700', color: BRAND_COLORS.textDark },
  blockDescription: { fontSize: 14, color: BRAND_COLORS.textMuted, lineHeight: 20, fontWeight: '500', marginBottom: 16 },
  
  // Custom Buttons matching your image
  actionButton: { backgroundColor: BRAND_COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 12 },
  disabledButton: { backgroundColor: '#CBEFDE' },
  actionButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  textLink: { color: BRAND_COLORS.primary, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline', textAlign: 'center' },
  footnote: { fontSize: 12, color: BRAND_COLORS.textMuted, textAlign: 'center', fontWeight: '500', marginTop: 4 },

  // Horizontal Card Settings
  carouselSpacing: { paddingLeft: 0, gap: 12, paddingBottom: 16 },
  communityCard: { backgroundColor: '#FFF', width: 150, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: BRAND_COLORS.borderLight },
  cardImage: { width: '100%', height: 95, backgroundColor: '#EEE' },
  cardContent: { padding: 10, position: 'relative' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: BRAND_COLORS.textDark },
  cardMeta: { fontSize: 11, color: BRAND_COLORS.textMuted, marginTop: 4, fontWeight: '500' },
  cardBadge: { position: 'absolute', bottom: 10, right: 10 },

  // Invite Section Layout
  inlineCardTitle: { fontSize: 15, fontWeight: '700', color: BRAND_COLORS.textDark, marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 10, height: 48, width: '100%' },
  textInput: { flex: 1, backgroundColor: '#F7FAF8', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: BRAND_COLORS.textDark },
  inlineJoinButton: { backgroundColor: BRAND_COLORS.primary, paddingHorizontal: 24, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  inlineJoinButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  // Footer Setup Blocks
  footerBlock: { alignItems: 'center', marginTop: 16, width: '100%' },
  globalContinueButton: { backgroundColor: BRAND_COLORS.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 14 },
  globalButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  textLinkSecondary: { color: BRAND_COLORS.primary, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  dividerLine: { height: 1, backgroundColor: BRAND_COLORS.borderLight, width: '100%', marginTop: 24, marginBottom: 14 },
  bottomDisclaimer: { fontSize: 13, color: BRAND_COLORS.textMuted, fontWeight: '500', textAlign: 'center' }
});