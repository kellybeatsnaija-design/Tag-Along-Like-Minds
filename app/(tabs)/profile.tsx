import { Bell, CreditCard, Edit3, LogOut, Mail, Map, Phone, Settings, Shield, User, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BRAND_COLORS } from '../../constants/Colors';

import SettingsRowItem from '../../components/SettingsRowItem';
import TrustProgressCard from '../../components/TrustProgressCard';

type ActiveModalType = 'account' | 'notifications' | 'location' | 'privacy' | 'contacts' | 'payments' | null;

export default function ConsolidatedProfileSettingsScreen() {
  // Privacy switches states from Page 3
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [chatReminders, setChatReminders] = useState(true);
  const [safetyUpdates, setSafetyUpdates] = useState(false);
  const [approxLocation, setApproxLocation] = useState(true);

  // 💡 NEW STATE: Tracks which modal is currently visible on screen
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);

  const communities = ['Lekki Study Circle', 'Creative Learning Hub'];
  const preferences = ['Low-pressure', 'Same-gender comfort', 'Supportive'];

  // Handler to close the active modal sheet cleanly
  const closeModal = () => setActiveModal(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TOP PROFILE IDENTIFIER BAR - PAGE 1 */}
        <View style={styles.profileIdentifierCard}>
          <View style={styles.topActionHeaderRow}>
            <TouchableOpacity style={styles.headerIconButton}><Edit3 size={20} color={BRAND_COLORS.textDark} /></TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton}><Settings size={20} color={BRAND_COLORS.textDark} /></TouchableOpacity>
          </View>

          <Image source={{ uri: 'https://dicebear.com' }} style={styles.avatarImagePlacement} />
          <Text style={styles.profileNameTitle}>Augustine ✓</Text>
          <View style={styles.verifiedBadgeRow}><Text style={styles.verifiedBadgeText}>Verified Member</Text></View>

          <View style={styles.metricsSummaryRowBlock}>
            <View style={styles.metricEntryItem}><Text style={styles.metricValueString}>4.8</Text><Text style={styles.metricLabelString}>Reputation</Text></View>
            <View style={styles.metricVerticalSeparatorLine} />
            <View style={styles.metricEntryItem}><Text style={styles.metricValueString}>12</Text><Text style={styles.metricLabelString}>Activities Completed</Text></View>
          </View>
        </View>

        {/* TRUST PROGRESS DECOUPLED SEGMENT CARD */}
        <TrustProgressCard onStartIdCheck={() => alert('Launching Secure Biometric Camera Array...')} />

        {/* COMMUNITIES CHIP MATRICES - PAGE 1 */}
        <View style={styles.metaPreferenceCardCanvas}>
          <Text style={styles.sectionHeaderTitle}>My Communities</Text>
          <View style={styles.chipClusterRow}>
            {communities.map((c) => (
              <View key={c} style={styles.baseChipBadge}><Text style={styles.baseChipTextString}>{c}</Text></View>
            ))}
          </View>
        </View>

        {/* MOVEMENT PREFERENCES CHIP MATRICES - PAGE 1 */}
        <View style={styles.metaPreferenceCardCanvas}>
          <Text style={styles.sectionHeaderTitle}>Comfort Preferences</Text>
          <View style={styles.chipClusterRow}>
            {preferences.map((p) => (
              <View key={p} style={[styles.baseChipBadge, styles.prefChipColorHighlight]}><Text style={styles.baseChipTextString}>{p}</Text></View>
            ))}
          </View>
        </View>

        {/* 💡 FIXED ACTIONABLE ACCOUNT MANAGEMENT MENUS - PAGE 3 */}
        <Text style={styles.hubGroupSectionTitleHeader}>ACCOUNT MANAGEMENT</Text>
        <SettingsRowItem icon={<User size={18} color={BRAND_COLORS.primary} />} label="Account details" onPress={() => setActiveModal('account')} />
        <SettingsRowItem icon={<Bell size={18} color={BRAND_COLORS.primary} />} label="Notifications" onPress={() => setActiveModal('notifications')} />
        <SettingsRowItem icon={<Map size={18} color={BRAND_COLORS.primary} />} label="Location permissions" onPress={() => setActiveModal('location')} />
        <SettingsRowItem icon={<Shield size={18} color={BRAND_COLORS.primary} />} label="Privacy controls" onPress={() => setActiveModal('privacy')} />
        <SettingsRowItem icon={<Users size={18} color={BRAND_COLORS.primary} />} label="Trusted contacts" onPress={() => setActiveModal('contacts')} />
        <SettingsRowItem icon={<CreditCard size={18} color={BRAND_COLORS.primary} />} label="Payment preferences" onPress={() => setActiveModal('payments')} />

        {/* HARDWARE PERMISSIONS TOGGLE CONSOLE - PAGE 3 */}
        <Text style={styles.hubGroupSectionTitleHeader}>NOTIFICATION & PRIVACY CONTROLS</Text>
        <View style={styles.toggleConsoleCardCanvas}>
          <View style={styles.toggleRowItem}>
            <Text style={styles.toggleLabelTitleString}>Match alerts</Text>
            <Switch value={matchAlerts} onValueChange={setMatchAlerts} trackColor={{ false: '#E2EBE7', true: BRAND_COLORS.primary }} />
          </View>
          <View style={styles.toggleRowDividerLine} />
          <View style={styles.toggleRowItem}>
            <Text style={styles.toggleLabelTitleString}>Chat reminders</Text>
            <Switch value={chatReminders} onValueChange={setChatReminders} trackColor={{ false: '#E2EBE7', true: BRAND_COLORS.primary }} />
          </View>
          <View style={styles.toggleRowDividerLine} />
          <View style={styles.toggleRowItem}>
            <Text style={styles.toggleLabelTitleString}>Safety updates</Text>
            <Switch value={safetyUpdates} onValueChange={setSafetyUpdates} trackColor={{ false: '#E2EBE7', true: BRAND_COLORS.primary }} />
          </View>
          <View style={styles.toggleRowDividerLine} />
          <View style={styles.toggleRowItem}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.toggleLabelTitleString}>Share approximate location first</Text>
              <Text style={styles.toggleLabelDescriptionString}>Hides your exact spot until the circle feels comfortable and mutual.</Text>
            </View>
            <Switch value={approxLocation} onValueChange={setApproxLocation} trackColor={{ false: '#E2EBE7', true: BRAND_COLORS.primary }} />
          </View>
        </View>

        <TouchableOpacity style={styles.sessionTerminationActionRowBtn} activeOpacity={0.8}>
          <LogOut size={18} color="#C62828" style={{ marginRight: 8 }} />
          <Text style={styles.sessionTerminationBtnLabelTextString}>Log out</Text>
        </TouchableOpacity>

        <Text style={styles.appVersionFootnoteTextString}>Tag Along v1.0 • Built with Trust</Text>
      </ScrollView>

      {/* ====================================================================
          💡 CONDITIONAL ACTIONABLE MODALS SHEET LAYER CONSOLE (PAGE 3 HANDSHAKES)
          ==================================================================== */}
      
      {/* MODAL 1: ACCOUNT DETAILS */}
      <Modal visible={activeModal === 'account'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRootContainer}>
          <View style={styles.modalHeaderBar}><Text style={styles.modalMainTitleHeader}>Account Details</Text><TouchableOpacity onPress={closeModal}><X size={22} color={BRAND_COLORS.textDark} /></TouchableOpacity></View>
          <ScrollView contentContainerStyle={styles.modalContentPadding}>
            <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
            <View style={styles.modalInputBox}><User size={16} color="#A0B2AC" style={{ marginRight: 10 }} /><TextInput style={styles.modalInput} value="Augustine" editable={false} /></View>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={styles.modalInputBox}><Mail size={16} color="#A0B2AC" style={{ marginRight: 10 }} /><TextInput style={styles.modalInput} value="augustine@lekkiestate.com" editable={false} /></View>
            <Text style={styles.fieldLabel}>PHONE MATRIX</Text>
            <View style={styles.modalInputBox}><Phone size={16} color="#A0B2AC" style={{ marginRight: 10 }} /><TextInput style={styles.modalInput} value="+234 803 123 4567" editable={false} /></View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={closeModal}><Text style={styles.modalSaveBtnText}>Save Account details</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 2: NOTIFICATIONS HUB PANEL */}
      <Modal visible={activeModal === 'notifications'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRootContainer}>
          <View style={styles.modalHeaderBar}><Text style={styles.modalMainTitleHeader}>Notification Settings</Text><TouchableOpacity onPress={closeModal}><X size={22} color={BRAND_COLORS.textDark} /></TouchableOpacity></View>
          <ScrollView contentContainerStyle={styles.modalContentPadding}>
            <View style={styles.modalCard}><Text style={styles.modalCardTitle}>System Push Alerts</Text><Text style={styles.modalCardDesc}>All primary match alerts, chat reminders, and safety updates are actively managed via your device system notification dashboard preference tray.</Text></View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={closeModal}><Text style={styles.modalSaveBtnText}>Done</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 3: LOCATION PERMISSIONS SUB-PANEL */}
      <Modal visible={activeModal === 'location'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRootContainer}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalMainTitleHeader}>Location Spacing</Text>
            <TouchableOpacity onPress={closeModal}><X size={22} color={BRAND_COLORS.textDark} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContentPadding}>
            <View style={styles.modalCard}>
              <Text style={styles.modalCardTitle}>✓ Foreground GPS Connected</Text>
              <Text style={styles.modalCardDesc}>Your phone is currently configured to automatically fetch active community hubs and calculate spatial matches when you declare pathways.</Text>
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={closeModal}><Text style={styles.modalSaveBtnText}>Done</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 4: PRIVACY CONTROLS */}
      <Modal visible={activeModal === 'privacy'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRootContainer}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalMainTitleHeader}>Privacy Policy Controls</Text>
            <TouchableOpacity onPress={closeModal}><X size={22} color={BRAND_COLORS.textDark} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContentPadding}>
            <View style={styles.modalCard}>
              <Text style={styles.modalCardTitle}>Cryptographic Masking</Text>
              <Text style={styles.modalCardDesc}>Tag Along cryptographically hashes address profiles. Your exact coordinate points clear securely only when a cross-route matching choice is mutually locked.</Text>
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={closeModal}><Text style={styles.modalSaveBtnText}>Done</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 5: TRUSTED CONTACTS ADDRESS SYNC */}
      <Modal visible={activeModal === 'contacts'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRootContainer}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalMainTitleHeader}>Trusted Contacts</Text>
            <TouchableOpacity onPress={closeModal}><X size={22} color={BRAND_COLORS.textDark} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContentPadding}>
            <Text style={styles.fieldLabel}>CONNECTED ADDRESS ENTRIES</Text>
            <View style={styles.contactItemRow}>
              <Image source={{ uri: 'https://dicebear.com' }} style={styles.contactAvatar} />
              <View>
                <Text style={styles.contactName}>Ada (Lekki Estate)</Text>
                <Text style={styles.contactSub}>Connected via Address Sync</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={closeModal}><Text style={styles.modalSaveBtnText}>Sync Additional Contacts</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 6: PAYMENT preferences PRESETS */}
      <Modal visible={activeModal === 'payments'} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRootContainer}>
          <View style={styles.modalHeaderBar}>
            <Text style={styles.modalMainTitleHeader}>Payment Preferences</Text>
            <TouchableOpacity onPress={closeModal}><X size={22} color={BRAND_COLORS.textDark} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContentPadding}>
            <View style={styles.modalCard}>
              <Text style={styles.modalCardTitle}>💳 Connected Wallet Ledger</Text>
              <Text style={styles.modalCardDesc}>All shared transit cost splits are secured through your connected account ledger and managed via our automated sandboxed escrow holds loop.</Text>
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={closeModal}><Text style={styles.modalSaveBtnText}>Done</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>


    </SafeAreaView>
);
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BRAND_COLORS.bgCanvas },
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  profileIdentifierCard: { backgroundColor: BRAND_COLORS.cardWhite, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: BRAND_COLORS.borderLight, alignItems: 'center', marginBottom: 16 },
  topActionHeaderRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', gap: 12, marginBottom: 4 },
  headerIconButton: { padding: 6, backgroundColor: '#F5FAF6', borderRadius: 10 },
  avatarImagePlacement: { width: 84, height: 84, borderRadius: 42, backgroundColor: BRAND_COLORS.primaryLight, marginBottom: 10 },
  profileNameTitle: { fontSize: 22, fontWeight: '800', color: BRAND_COLORS.textDark },
  verifiedBadgeRow: { backgroundColor: BRAND_COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 4, marginBottom: 14 },
  verifiedBadgeText: { fontSize: 12, fontWeight: '700', color: BRAND_COLORS.primaryDark },
  metricsSummaryRowBlock: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#F2F7F4', paddingTop: 12, marginTop: 4 },
  metricEntryItem: { flex: 1, alignItems: 'center' },
  metricValueString: { fontSize: 18, fontWeight: '800', color: BRAND_COLORS.textDark },
  metricLabelString: { fontSize: 12, color: BRAND_COLORS.textMuted, fontWeight: '500', marginTop: 2 },
  metricVerticalSeparatorLine: { width: 1, backgroundColor: '#EDF5F1', height: '70%', alignSelf: 'center' },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '700', color: BRAND_COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
  metaPreferenceCardCanvas: { backgroundColor: BRAND_COLORS.cardWhite, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: BRAND_COLORS.borderLight, marginBottom: 12 },
  chipClusterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  baseChipBadge: { backgroundColor: '#F0F5F2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  prefChipColorHighlight: { backgroundColor: '#FFF4EB' },
  baseChipTextString: { fontSize: 13, fontWeight: '600', color: BRAND_COLORS.textDark },
  hubGroupSectionTitleHeader: { fontSize: 11, fontWeight: '700', color: BRAND_COLORS.textMuted, letterSpacing: 1.5, marginTop: 20, marginBottom: 10, paddingHorizontal: 4 },
  toggleConsoleCardCanvas: { backgroundColor: BRAND_COLORS.cardWhite, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: BRAND_COLORS.borderLight, marginBottom: 16 },
  toggleRowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  toggleLabelTitleString: { fontSize: 14, fontWeight: '700', color: BRAND_COLORS.textDark },
  toggleLabelDescriptionString: { fontSize: 11, color: BRAND_COLORS.textMuted, marginTop: 4, lineHeight: 15 },
  toggleRowDividerLine: { height: 1, backgroundColor: '#F0F5F2', width: '100%', marginVertical: 12 },
  sessionTerminationActionRowBtn: { flexDirection: 'row', height: 50, backgroundColor: '#FFF5F5', borderRadius: 14, borderWidth: 1, borderColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 14 },
  sessionTerminationBtnLabelTextString: { color: '#C62828', fontSize: 15, fontWeight: '700' },
  appVersionFootnoteTextString: { fontSize: 12, color: BRAND_COLORS.textMuted, textAlign: 'center', marginTop: 24, fontWeight: '500' },
  // ==========================================
  // Modern Decoupled Modal Card Canvas Styles
  // ==========================================
  modalRootContainer: { flex: 1, backgroundColor: BRAND_COLORS.bgCanvas },
  modalHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: BRAND_COLORS.borderLight, backgroundColor: '#FFF', paddingTop: Platform.OS === 'ios' ? 24 : 20 },
  modalMainTitleHeader: { fontSize: 18, fontWeight: '800', color: BRAND_COLORS.textDark },
  modalContentPadding: { padding: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: BRAND_COLORS.textMuted, letterSpacing: 1, marginBottom: 6, marginTop: 10 },
  modalInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5FAF6', borderWidth: 1, borderColor: BRAND_COLORS.borderLight, borderRadius: 12, paddingHorizontal: 14, height: 50, marginBottom: 14 },
  modalInput: { flex: 1, fontSize: 14, fontWeight: '600', color: BRAND_COLORS.textDark, height: '100%' },
  modalSaveBtn: { backgroundColor: BRAND_COLORS.primary, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  modalSaveBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  modalCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: BRAND_COLORS.borderLight, gap: 8 },
  modalCardTitle: { fontSize: 15, fontWeight: '700', color: BRAND_COLORS.textDark },
  modalCardDesc: { fontSize: 13, color: BRAND_COLORS.textMuted, lineHeight: 18, fontWeight: '500' },
  contactItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: BRAND_COLORS.borderLight },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND_COLORS.primaryLight },
  contactName: { fontSize: 14, fontWeight: '700', color: BRAND_COLORS.textDark },
  contactSub: { fontSize: 12, color: BRAND_COLORS.textMuted, marginTop: 2, fontWeight: '500' }
});


