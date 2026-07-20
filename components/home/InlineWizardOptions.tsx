import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TagAlongColors } from '../../constants/Colors';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary'];

interface InlineWizardOptionsProps {
  interactiveStep: 'size' | 'comfort' | 'gender_sub_grid' | 'mood' | 'timing' | 'calendar_picker' | 'interaction' | 'call_time_picker' | 'done' | undefined;
  onSelectSize: (size: number) => void;
  onSelectComfort: (mode: string) => void;
  onConfirmGenders?: (genders: string[]) => void;
  onSelectMood: (mood: string) => void;
  onSelectTiming: (type: 'now' | 'later') => void;
  onConfirmTimestamp?: (finalDate: Date) => void;
  onSelectMode: (mode: 'chat' | 'call') => void;
  onConfirmCallTime?: (finalDate: Date) => void;
}

export default function InlineWizardOptions({
  interactiveStep,
  onSelectSize,
  onSelectComfort,
  onConfirmGenders,
  onSelectMood,
  onSelectTiming,
  onConfirmTimestamp,
  onSelectMode,
  onConfirmCallTime,
}: InlineWizardOptionsProps) {
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  if (!interactiveStep || interactiveStep === 'done') return null;

  const toggleGender = (gender: string) => {
    setSelectedGenders(prev => prev.includes(gender) ? prev.filter(g => g !== gender) : [...prev, gender]);
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

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <View style={styles.container}>
      {/* 👥 CAPACITY SELECTOR */}
      {interactiveStep === 'size' && (
        <View style={styles.optionsRow}>
          {[1, 2, 3, 4].map(num => (
            <TouchableOpacity key={num} style={styles.optionBtn} onPress={() => onSelectSize(num)} activeOpacity={0.7}>
              <Ionicons name="people-outline" size={14} color={TagAlongColors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.optionBtnText}>{num} Person{num > 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 🛡️ PRIVACY / GENDER FILTER COMFORT */}
      {interactiveStep === 'comfort' && (
        <View style={styles.optionsRow}>
          {['Anyone', 'Gender-specific comfort'].map(mode => (
            <TouchableOpacity key={mode} style={styles.optionBtn} onPress={() => onSelectComfort(mode)} activeOpacity={0.7}>
              <Ionicons name={mode.includes('Anyone') ? 'globe-outline' : 'shield-checkmark-outline'} size={14} color={TagAlongColors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.optionBtnText}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 🚻 GENDER SUB-GRID */}
      {interactiveStep === 'gender_sub_grid' && (
        <View style={styles.verticalStack}>
          <View style={styles.optionsRow}>
            {GENDER_OPTIONS.map(gender => {
              const isSelected = selectedGenders.includes(gender);
              return (
                <TouchableOpacity
                  key={gender}
                  style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                  onPress={() => toggleGender(gender)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={isSelected ? '#FFFFFF' : TagAlongColors.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.optionBtnText, isSelected && styles.optionBtnTextSelected]}>{gender}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.confirmBtn, selectedGenders.length === 0 && styles.confirmBtnDisabled]}
            disabled={selectedGenders.length === 0}
            onPress={() => onConfirmGenders?.(selectedGenders)}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmBtnText}>Confirm selection</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🌤️ SOCIAL MOOD / ENERGY */}
      {interactiveStep === 'mood' && (
        <View style={styles.optionsRow}>
          {['Low-pressure', 'Focused', 'Buzzing', 'Supportive'].map(mood => (
            <TouchableOpacity key={mood} style={styles.optionBtn} onPress={() => onSelectMood(mood)} activeOpacity={0.7}>
              <Ionicons name="sparkles-outline" size={14} color={TagAlongColors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.optionBtnText}>{mood}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ⏰ TIMING CONFIGURATIONS */}
      {interactiveStep === 'timing' && (
        <View style={styles.optionsRow}>
          <TouchableOpacity style={styles.optionBtn} onPress={() => onSelectTiming('now')} activeOpacity={0.7}>
            <Ionicons name="flash-outline" size={14} color={TagAlongColors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.optionBtnText}>Right now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBtn} onPress={() => onSelectTiming('later')} activeOpacity={0.7}>
            <Ionicons name="calendar-outline" size={14} color={TagAlongColors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.optionBtnText}>Schedule later</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 📅 CALENDAR / SCHEDULE PICKER */}
      {interactiveStep === 'calendar_picker' && (
        <View style={styles.verticalStack}>
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.optionBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
              <Ionicons name="calendar" size={14} color={TagAlongColors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.optionBtnText}>{formatDate(scheduledDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
              <Ionicons name="time" size={14} color={TagAlongColors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.optionBtnText}>{formatTime(scheduledDate)}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirmTimestamp?.(scheduledDate)} activeOpacity={0.7}>
            <Text style={styles.confirmBtnText}>Confirm schedule</Text>
          </TouchableOpacity>

          <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <DateTimePicker
                  value={scheduledDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={onDateChange}
                  accentColor={TagAlongColors.primary}
                  themeVariant="light"
                />
                <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.confirmBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <DateTimePicker
                  value={scheduledDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                  accentColor={TagAlongColors.primary}
                  themeVariant="light"
                />
                <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.confirmBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {/* 🎥 CHANNELS INTERACTION CHIPS */}
      {interactiveStep === 'interaction' && (
        <View style={styles.verticalStack}>
          <TouchableOpacity style={styles.stackBtn} onPress={() => onSelectMode('chat')} activeOpacity={0.7}>
            <View style={styles.stackLeftRow}>
              <Ionicons name="chatbubbles-outline" size={16} color={TagAlongColors.primary} />
              <Text style={styles.optionBtnText}>💬 Chat only</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.stackBtn} onPress={() => onSelectMode('call')} activeOpacity={0.7}>
            <View style={styles.stackLeftRow}>
              <Ionicons name="call-outline" size={16} color={TagAlongColors.primary} />
              <Text style={styles.optionBtnText}>📞 Call</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}

      {/* 📞 CALL TIME PICKER */}
      {interactiveStep === 'call_time_picker' && (
        <View style={styles.verticalStack}>
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.optionBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
              <Ionicons name="calendar" size={14} color={TagAlongColors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.optionBtnText}>{formatDate(scheduledDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
              <Ionicons name="time" size={14} color={TagAlongColors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.optionBtnText}>{formatTime(scheduledDate)}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirmCallTime?.(scheduledDate)} activeOpacity={0.7}>
            <Text style={styles.confirmBtnText}>Confirm call time</Text>
          </TouchableOpacity>

          <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <DateTimePicker
                  value={scheduledDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={onDateChange}
                  accentColor={TagAlongColors.primary}
                  themeVariant="light"
                />
                <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.confirmBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <DateTimePicker
                  value={scheduledDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                  accentColor={TagAlongColors.primary}
                  themeVariant="light"
                />
                <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.confirmBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12, width: '100%', paddingLeft: 4 },
  optionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', width: '100%' },
  verticalStack: { gap: 8, width: '100%', maxWidth: 280 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  stackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16 },
  stackLeftRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionBtnText: { color: TagAlongColors.textDark || '#1E293B', fontSize: 14, fontWeight: '600' },
  optionBtnSelected: { backgroundColor: TagAlongColors.primary, borderColor: TagAlongColors.primary },
  optionBtnTextSelected: { color: '#FFFFFF' },
  confirmBtn: { backgroundColor: TagAlongColors.primary, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#CBD5E1' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 24, width: '100%', padding: 20, gap: 12 },
});
