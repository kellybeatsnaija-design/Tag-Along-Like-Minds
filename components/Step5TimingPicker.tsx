import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { TagAlongColors } from '../constants/Colors';

interface Step5Props {
  value: 'now' | 'later';
  onChange: (val: 'now' | 'later') => void;
}

export default function Step5TimingPicker({ value, onChange }: Step5Props) {
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  
  // Modal states used to isolate the picker components safely
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      const updatedDate = new Date(scheduledDate);
      updatedDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setScheduledDate(updatedDate);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedTime) {
      const updatedTime = new Date(scheduledDate);
      updatedTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setScheduledDate(updatedTime);
    }
  };

  return (
    <View style={styles.stepWrapper}>
      <Text style={styles.mainPromptText}>When do you want to connect?</Text>
      <Text style={styles.subPromptText}>Choose what works best for your energy today.</Text>
      
      <View style={styles.timeCardContainer}>
        {/* RIGHT NOW */}
        <TouchableOpacity 
          style={[styles.timeOptionCard, value === 'now' && styles.activeTimeOptionCard]} 
          onPress={() => onChange('now')}
          activeOpacity={0.8}
        >
          <Ionicons name="headset-outline" size={32} color={value === 'now' ? '#FFFFFF' : TagAlongColors.primary} />
          <Text style={[styles.timeOptionTitle, value === 'now' && styles.activeTimeOptionText]}>
            Right now
          </Text>
        </TouchableOpacity>
        
        {/* SCHEDULE FOR LATER */}
        <TouchableOpacity 
          style={[styles.timeOptionCard, value === 'later' && styles.activeTimeOptionCardSecondary]} 
          onPress={() => onChange('later')}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={32} color={value === 'later' ? '#FFFFFF' : '#A78BFA'} />
          <Text style={[styles.timeOptionTitle, value === 'later' && styles.activeTimeOptionText]}>
            Schedule for later
          </Text>
        </TouchableOpacity>
      </View>

      {/* SCHEDULE SELECTOR INTERFACE */}
      {value === 'later' && (
        <View style={styles.pickerSubContainer}>
          <Text style={styles.pickerSectionLabel}>Set Session Timestamp Parameters</Text>
          
          <View style={styles.pickerRowButtons}>
            <TouchableOpacity style={styles.selectorCardBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={16} color={TagAlongColors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.selectorCardText}>{formatDate(scheduledDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectorCardBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time" size={16} color="#A78BFA" style={{ marginRight: 6 }} />
              <Text style={styles.selectorCardText}>{formatTime(scheduledDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <Text style={styles.energyLabelFooter}>
        You can start now or choose a safe time to connect for a relaxed online catch-up later.
      </Text>

      {/* DATE PICKER MODAL CONTAINER */}
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlayCanvas}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderBar}>
              <Text style={styles.modalCardHeading}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={22} color={TagAlongColors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.nativeComponentFrameHolder}>
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()}
                onChange={onDateChange}
                accentColor={TagAlongColors.primary}
                themeVariant="light"
              />
            </View>

            <TouchableOpacity style={styles.modalActionConfirmCloseBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.modalActionConfirmCloseBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TIME PICKER MODAL CONTAINER */}
      <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
        <View style={styles.modalOverlayCanvas}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderBar}>
              <Text style={styles.modalCardHeading}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={22} color={TagAlongColors.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.nativeComponentFrameHolder}>
              <DateTimePicker
                value={scheduledDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                accentColor={TagAlongColors.primary}
                themeVariant="light"
              />
            </View>

            <TouchableOpacity style={styles.modalActionConfirmCloseBtn} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.modalActionConfirmCloseBtnText}>Confirm Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  stepWrapper: { width: '100%' },
  mainPromptText: { fontSize: 22, fontWeight: '700', color: TagAlongColors.textDark, textAlign: 'center', marginBottom: 8, lineHeight: 28 },
  subPromptText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  timeCardContainer: { gap: 14, marginBottom: 20 },
  timeOptionCard: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 20, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 6 },
  activeTimeOptionCard: { backgroundColor: TagAlongColors.primary, borderColor: TagAlongColors.primary },
  activeTimeOptionCardSecondary: { backgroundColor: '#A78BFA', borderColor: '#A78BFA' },
  timeOptionTitle: { fontSize: 16, fontWeight: '700', color: TagAlongColors.textDark },
  activeTimeOptionText: { color: '#FFFFFF' },
  
  pickerSubContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, padding: 20, marginBottom: 20, alignItems: 'center' },
  pickerSectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  pickerRowButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  selectorCardBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 14, height: 48 },
  selectorCardText: { fontSize: 14, fontWeight: '600', color: TagAlongColors.textDark },
  energyLabelFooter: { fontSize: 13, color: '#64748B', textAlign: 'center', paddingHorizontal: 16, lineHeight: 18, marginTop: 4 },

  // Isolated Modal Styling to guarantee high contrast light mode numbers
  modalOverlayCanvas: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContentCard: { backgroundColor: '#FFFFFF', borderRadius: 24, width: '100%', padding: 20 },
  modalHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalCardHeading: { fontSize: 16, fontWeight: '700', color: TagAlongColors.textDark },
  nativeComponentFrameHolder: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 8, overflow: 'hidden', minHeight: 220, justifyContent: 'center' },
  modalActionConfirmCloseBtn: { backgroundColor: TagAlongColors.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  modalActionConfirmCloseBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' }
});
