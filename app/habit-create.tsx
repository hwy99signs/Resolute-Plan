import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Modal, Alert, Share, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Clock, Share2 } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useAuth } from '../src/contexts/AuthContext';
import { HabitService } from '../src/services/habit.service';
import BottomTabBar from '../src/components/BottomTabBar';
import { SuccessModal } from '../src/components/SuccessModal';

// Conditional import for DateTimePicker
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  console.warn('DateTimePicker not available, using fallback');
}

const DAYS = [
  { id: 1, label: 'Monday', short: 'Mon' },
  { id: 2, label: 'Tuesday', short: 'Tue' },
  { id: 3, label: 'Wednesday', short: 'Wed' },
  { id: 4, label: 'Thursday', short: 'Thu' },
  { id: 5, label: 'Friday', short: 'Fri' },
  { id: 6, label: 'Saturday', short: 'Sat' },
  { id: 7, label: 'Sunday', short: 'Sun' },
];

interface DaySchedule {
  day: number;
  label: string;
  time: string | null;
  enabled: boolean;
}

export default function HabitCreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState<number | null>(null);
  const [customWeeks, setCustomWeeks] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(
    DAYS.map(day => ({ day: day.id, label: day.label, time: null, enabled: false }))
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [tempTime, setTempTime] = useState(new Date());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const durationOptions = [4, 8, 12, 16, 20, null]; // null = no limit

  const handleDayToggle = (dayId: number) => {
    setDaySchedules(prev => 
      prev.map(schedule => 
        schedule.day === dayId 
          ? { ...schedule, enabled: !schedule.enabled }
          : schedule
      )
    );
  };

  const handleTimeSelect = (dayId: number) => {
    const schedule = daySchedules.find(s => s.day === dayId);
    const date = new Date();
    
    if (schedule?.time) {
      // Use existing time if available
      const [hours, minutes] = schedule.time.split(':');
      if (!isNaN(parseInt(hours)) && !isNaN(parseInt(minutes))) {
        date.setHours(parseInt(hours), parseInt(minutes));
      } else {
        // If time format is invalid, use current time
        const now = new Date();
        date.setHours(now.getHours(), now.getMinutes());
      }
    } else {
      // Use current time instead of defaulting to 8am
      const now = new Date();
      date.setHours(now.getHours(), now.getMinutes());
    }
    
    setTempTime(date);
    setSelectedDay(dayId);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = () => {
    if (selectedDay !== null) {
      const hours = tempTime.getHours().toString().padStart(2, '0');
      const minutes = tempTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      setDaySchedules(prev =>
        prev.map(schedule =>
          schedule.day === selectedDay
            ? { ...schedule, time: timeString }
            : schedule
        )
      );
      setShowTimePicker(false);
      setSelectedDay(null);
    }
  };

  const validateAndSetTime = (dayId: number, timeString: string) => {
    // Validate time format HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (timeRegex.test(timeString)) {
      setDaySchedules(prev =>
        prev.map(schedule =>
          schedule.day === dayId
            ? { ...schedule, time: timeString }
            : schedule
        )
      );
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return t('habit.setTime');
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleCreate = async () => {
    if (!habitName.trim()) {
      Alert.alert(t('common.error'), t('habit.enterHabitName'));
      return;
    }

    const enabledDays = daySchedules.filter(s => s.enabled);
    if (enabledDays.length === 0) {
      Alert.alert(t('common.error'), t('habit.selectAtLeastOneDay'));
      return;
    }

    // Validate time format for all enabled days
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const daysWithoutTime = enabledDays.filter(s => !s.time || !timeRegex.test(s.time));
    if (daysWithoutTime.length > 0) {
      Alert.alert(t('common.error'), t('habit.setValidTime'));
      return;
    }

    try {
      // Convert day IDs to day_of_week (0 = Sunday, 1 = Monday, etc.)
      // Our DAYS array: Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6, Sunday=7
      // Database: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      const dayMap: Record<number, number> = {
        1: 1, // Monday
        2: 2, // Tuesday
        3: 3, // Wednesday
        4: 4, // Thursday
        5: 5, // Friday
        6: 6, // Saturday
        7: 0, // Sunday
      };

      const schedules = enabledDays.map(schedule => ({
        day_of_week: dayMap[schedule.day],
        time: schedule.time!,
      }));

      await HabitService.createHabit({
        name: habitName.trim(),
        description: description.trim() || undefined,
        duration_weeks: durationWeeks,
        schedules,
      });

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error creating habit:', error);
      Alert.alert(t('common.error'), error.message || t('habit.failedToCreate'));
    }
  };

  const handleShare = async () => {
    if (!habitName.trim()) {
      Alert.alert(t('common.error'), t('habit.enterHabitNameFirst'));
      return;
    }

    const enabledDays = daySchedules
      .filter(s => s.enabled && s.time)
      .map(s => {
        const dayLabel = DAYS.find(d => d.id === s.day)?.label || '';
        return `${dayLabel} at ${formatTime(s.time)}`;
      })
      .join(', ');

    const shareMessage = `I'm starting a new daily habit: "${habitName}"\n\nSchedule:\n${enabledDays}\n\nJoin me on Resolute Plan pro!`;

    try {
      await Share.share({
        message: shareMessage,
        title: t('habit.shareHabitTitle'),
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Create Daily Habit</Text>
        <TouchableOpacity onPress={handleShare}>
          <Share2 size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Habit Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>{t('habit.habitName')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder={t('habit.habitNamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={habitName}
            onChangeText={setHabitName}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>{t('habit.description')}</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder={t('habit.descriptionPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>{t('habit.duration')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {t('habit.durationHint')}
          </Text>
          <View style={styles.durationContainer}>
            {durationOptions.map((weeks) => (
              <TouchableOpacity
                key={weeks ?? 'unlimited'}
                style={[
                  styles.durationOption,
                  durationWeeks === weeks && !showCustomInput && { backgroundColor: colors.primary },
                  { borderColor: colors.border }
                ]}
                onPress={() => {
                  if (weeks === null) {
                    setShowCustomInput(true);
                  } else {
                    setShowCustomInput(false);
                    setDurationWeeks(weeks);
                  }
                }}
              >
                <Text style={[
                  styles.durationText,
                  { color: durationWeeks === weeks && !showCustomInput ? '#FFFFFF' : colors.text }
                ]}>
                  {weeks ? `${weeks} ${t('dashboard.weeks')}` : t('habit.custom')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {showCustomInput && (
            <View style={styles.customInputContainer}>
              <TextInput
                style={[styles.customInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder={t('habit.enterWeeks')}
                placeholderTextColor={colors.textSecondary}
                value={customWeeks}
                onChangeText={(text) => {
                  setCustomWeeks(text);
                  const weeks = parseInt(text);
                  if (!isNaN(weeks) && weeks > 0) {
                    setDurationWeeks(weeks);
                  } else if (text === '') {
                    setDurationWeeks(null);
                  }
                }}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.noLimitButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowCustomInput(false);
                  setCustomWeeks('');
                  setDurationWeeks(null);
                }}
              >
                <Text style={[styles.noLimitText, { color: colors.text }]}>{t('habit.noLimit')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Day Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>{t('habit.selectDays')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {t('habit.selectDaysHint')}
          </Text>
          
          <View style={styles.daysContainer}>
            {daySchedules.map((schedule) => {
              const dayInfo = DAYS.find(d => d.id === schedule.day);
              return (
                <View key={schedule.day} style={styles.dayRow}>
                  <TouchableOpacity
                    style={[
                      styles.dayToggle,
                      schedule.enabled && { backgroundColor: colors.primary },
                      { borderColor: colors.border }
                    ]}
                    onPress={() => handleDayToggle(schedule.day)}
                  >
                    <Text style={[
                      styles.dayToggleText,
                      { color: schedule.enabled ? '#FFFFFF' : colors.text }
                    ]}>
                      {dayInfo?.short}
                    </Text>
                  </TouchableOpacity>
                  
                  {schedule.enabled && (
                    <View style={styles.timeInputContainer}>
                      <TextInput
                        style={[styles.timeInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        placeholder="HH:MM"
                        placeholderTextColor={colors.textSecondary}
                        value={schedule.time || ''}
                        onChangeText={(text) => {
                          // Allow typing time in HH:MM format
                          const cleaned = text.replace(/[^0-9:]/g, '');
                          if (cleaned.length <= 5) {
                            let formatted = cleaned;
                            // Auto-add colon after 2 digits
                            if (cleaned.length === 2 && !cleaned.includes(':')) {
                              formatted = cleaned + ':';
                            }
                            // Only allow valid time format
                            if (formatted.match(/^([0-1]?[0-9]|2[0-3]):?([0-5]?[0-9]?)?$/)) {
                              setDaySchedules(prev =>
                                prev.map(s =>
                                  s.day === schedule.day
                                    ? { ...s, time: formatted || null }
                                    : s
                                )
                              );
                            }
                          }
                        }}
                        onBlur={() => {
                          // Validate and format on blur
                          const currentSchedule = daySchedules.find(s => s.day === schedule.day);
                          if (currentSchedule?.time) {
                            const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                            if (!timeRegex.test(currentSchedule.time)) {
                              // Try to fix format
                              const parts = currentSchedule.time.split(':');
                              if (parts.length === 2) {
                                const hours = parseInt(parts[0]) || 0;
                                const minutes = parseInt(parts[1]) || 0;
                                if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                                  const fixed = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                  setDaySchedules(prev =>
                                    prev.map(s =>
                                      s.day === schedule.day
                                        ? { ...s, time: fixed }
                                        : s
                                    )
                                  );
                                } else {
                                  // Invalid, clear it
                                  setDaySchedules(prev =>
                                    prev.map(s =>
                                      s.day === schedule.day
                                        ? { ...s, time: null }
                                        : s
                                    )
                                  );
                                }
                              } else if (currentSchedule.time.length > 0) {
                                // Clear invalid format
                                setDaySchedules(prev =>
                                  prev.map(s =>
                                    s.day === schedule.day
                                      ? { ...s, time: null }
                                      : s
                                  )
                                );
                              }
                            }
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                      <TouchableOpacity
                        style={[styles.timePickerButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleTimeSelect(schedule.day)}
                      >
                        <Clock size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={handleCreate}
        >
          <Text style={styles.createButtonText}>{t('habit.createHabit')}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Time Picker Modal */}
      {showTimePicker && (
        Platform.OS === 'ios' && DateTimePicker ? (
          <Modal
            visible={showTimePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={[styles.modalButton, { color: colors.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Select Time</Text>
                  <TouchableOpacity onPress={handleTimeConfirm}>
                    <Text style={[styles.modalButton, { color: colors.primary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={(event: any, date?: Date) => {
                    if (date) setTempTime(date);
                  }}
                  textColor={colors.text}
                />
              </View>
            </View>
          </Modal>
        ) : Platform.OS === 'android' && DateTimePicker ? (
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="default"
            onChange={(event: any, date?: Date) => {
              if (event.type === 'set' && date && selectedDay !== null) {
                setTempTime(date);
                // Small delay to ensure state is updated
                setTimeout(() => {
                  const hours = date.getHours().toString().padStart(2, '0');
                  const minutes = date.getMinutes().toString().padStart(2, '0');
                  const timeString = `${hours}:${minutes}`;
                  
                  setDaySchedules(prev =>
                    prev.map(schedule =>
                      schedule.day === selectedDay
                        ? { ...schedule, time: timeString }
                        : schedule
                    )
                  );
                }, 100);
              }
              setShowTimePicker(false);
              setSelectedDay(null);
            }}
          />
        ) : null
      )}

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={t('common.success')}
        message={t('habit.habitCreated')}
        buttonText={t('common.done') || 'Done'}
        onButtonPress={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      />

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  daysContainer: {
    gap: 12,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayToggle: {
    width: 60,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeInputContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  timePickerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  customInputContainer: {
    marginTop: 12,
    gap: 12,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  noLimitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  noLimitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '600',
  },
});
