import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Dimensions, Platform, Modal } from 'react-native';
import { Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Calendar, Clock, Trash2, Save, Share2, CheckCircle2, Circle, X } from 'lucide-react-native';
import { HabitService, Habit, HabitSchedule } from '../src/services/habit.service';
import { supabase } from '../src/lib/supabase';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { SuccessModal } from '../src/components/SuccessModal';
import BottomTabBar from '../src/components/BottomTabBar';

// Conditional import for DateTimePicker
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  console.warn('DateTimePicker not available, using fallback');
}

const DAYS = [
  { id: 0, label: 'Sunday', short: 'Sun' },
  { id: 1, label: 'Monday', short: 'Mon' },
  { id: 2, label: 'Tuesday', short: 'Tue' },
  { id: 3, label: 'Wednesday', short: 'Wed' },
  { id: 4, label: 'Thursday', short: 'Thu' },
  { id: 5, label: 'Friday', short: 'Fri' },
  { id: 6, label: 'Saturday', short: 'Sat' },
];

interface DaySchedule {
  day: number;
  label: string;
  time: string | null;
  enabled: boolean;
  scheduleId?: string;
  isLocked?: boolean; // Past day - all past days are locked from editing
}

export default function HabitDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const habitId = params.id as string;
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [loadingCompletion, setLoadingCompletion] = useState(false);
  const [weekCompletions, setWeekCompletions] = useState<Map<string, 'completed' | 'missed'>>(new Map());
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadHabit();
  }, [habitId]);

  // Refresh completion status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkTodayCompletion();
      loadWeekCompletions();
    }, [habitId])
  );

  const loadHabit = async () => {
    try {
      setLoading(true);
      const habitData = await HabitService.getHabit(habitId);
      if (habitData) {
        setHabit(habitData);
        setHabitName(habitData.name);
        setDescription(habitData.description || '');
        
        // Load schedules
        const schedules = await HabitService.getHabitSchedules(habitId);
        
        // Get current week dates for each day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Load week completions to check for locked days
        const startDate = startOfWeek.toISOString().split('T')[0];
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const endDate = endOfWeek.toISOString().split('T')[0];
        const completions = await HabitService.getHabitCompletions(habitId, startDate, endDate);
        const completionMap = new Map<string, 'completed' | 'missed'>();
        completions.forEach(c => {
          const status = c.status || 'completed';
          if (status === 'completed' || status === 'missed') {
            completionMap.set(c.completion_date, status);
          }
        });
        
        const allDays = DAYS.map(day => {
          const schedule = schedules.find(s => s.day_of_week === day.id);
          // Calculate the date for this day in the current week
          const dayDate = new Date(startOfWeek);
          dayDate.setDate(startOfWeek.getDate() + day.id);
          dayDate.setHours(0, 0, 0, 0);
          const dayDateString = dayDate.toISOString().split('T')[0];
          const isPast = dayDate < today;
          const isToday = dayDateString === today.toISOString().split('T')[0];
          const dayStatus = completionMap.get(dayDateString);
          
          // Lock past days (before today) - they cannot be edited
          // Lock today only if it's been completed or missed
          // Future days are always editable
          let isLocked = false;
          if (isPast) {
            isLocked = true; // All past days are locked
          } else if (isToday) {
            // Today is locked only if it's been completed or missed
            isLocked = dayStatus === 'completed' || dayStatus === 'missed';
          }
          // Future days (isPast = false, isToday = false) are not locked
          
          return {
            day: day.id,
            label: day.label,
            time: schedule?.time || null,
            enabled: !!schedule,
            scheduleId: schedule?.id,
            isLocked: isLocked,
          };
        });
        setDaySchedules(allDays);
        
        // Check today's completion and load week completions
        await checkTodayCompletion();
        await loadWeekCompletions();
      }
    } catch (error: any) {
      // Handle status column error gracefully
      if (error.message?.includes('status') || error.message?.includes('schema cache')) {
        showErrorAlert(
          t('habit.databaseUpdateRequired'),
          t('habit.databaseUpdateMessage')
        );
      } else {
        showErrorAlert(t('common.error'), error.message || t('habit.failedToLoad'));
      }
    } finally {
      setLoading(false);
    }
  };

  const checkTodayCompletion = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const completions = await HabitService.getHabitCompletions(habitId, today, today);
      setIsCompletedToday(completions.length > 0 && completions[0]?.status === 'completed');
    } catch (error) {
      console.error('Error checking completion:', error);
    }
  };

  const loadWeekCompletions = async () => {
    try {
      // Get start of week (Sunday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Get end of week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];
      
      const completions = await HabitService.getHabitCompletions(habitId, startDate, endDate);
      const completionMap = new Map<string, 'completed' | 'missed'>();
      
      completions.forEach(c => {
        // Handle case where status might not exist yet (migration not run)
        const status = c.status || 'completed'; // Default to completed if status doesn't exist
        if (status === 'completed' || status === 'missed') {
          completionMap.set(c.completion_date, status);
        }
      });
      
      setWeekCompletions(completionMap);
    } catch (error: any) {
      // Silently handle status column errors - migration might not be run yet
      if (!error.message?.includes('status') && !error.message?.includes('schema cache')) {
        console.error('Error loading week completions:', error);
      }
    }
  };

  const handleToggleTodayCompletion = async () => {
    try {
      setLoadingCompletion(true);
      const today = new Date().toISOString().split('T')[0];
      
      if (isCompletedToday) {
        // Unmark as completed
        await HabitService.uncompleteHabit(habitId, today);
        setIsCompletedToday(false);
        weekCompletions.delete(today);
        setWeekCompletions(new Map(weekCompletions));
      } else {
        // Mark as completed
        await HabitService.completeHabit(habitId, today);
        setIsCompletedToday(true);
        weekCompletions.set(today, 'completed');
        setWeekCompletions(new Map(weekCompletions));
      }
    } catch (error: any) {
      showErrorAlert('Error', error.message || 'Failed to update completion');
    } finally {
      setLoadingCompletion(false);
    }
  };

  const handleDayStatusChange = async (date: string, currentStatus: 'completed' | 'missed' | null) => {
    try {
      if (currentStatus === 'completed') {
        // Change to missed
        await HabitService.updateHabitStatus(habitId, date, 'missed');
        weekCompletions.set(date, 'missed');
      } else if (currentStatus === 'missed') {
        // Change to completed
        await HabitService.updateHabitStatus(habitId, date, 'completed');
        weekCompletions.set(date, 'completed');
      } else {
        // Mark as completed
        await HabitService.updateHabitStatus(habitId, date, 'completed');
        weekCompletions.set(date, 'completed');
      }
      
      setWeekCompletions(new Map(weekCompletions));
      
      // Update today's status if needed
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        setIsCompletedToday(weekCompletions.get(today) === 'completed');
      }
    } catch (error: any) {
      // Handle status column error gracefully
      if (error.message?.includes('status') || error.message?.includes('schema cache')) {
        showErrorAlert(
          t('habit.databaseUpdateRequired'),
          t('habit.databaseUpdateMessage')
        );
      } else {
        showErrorAlert(t('common.error'), error.message || t('habit.failedToUpdateStatus'));
      }
    }
  };

  const getWeekDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const dateString = date.toISOString().split('T')[0];
      const dayName = DAYS[i].label;
      const dayShort = DAYS[i].short;
      const status = weekCompletions.get(dateString) || null;
      const isToday = dateString === todayString;
      const isPast = date < today;
      const isFuture = date > today;
      
      days.push({
        date: dateString,
        dayName,
        dayShort,
        status,
        isToday,
        isPast,
        isFuture,
      });
    }
    return days;
  };

  const handleDayToggle = async (dayId: number) => {
    const schedule = daySchedules.find(s => s.day === dayId);
    
    // Check if day is locked
    if (schedule?.isLocked) {
      // Determine the reason for locking
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + dayId);
      dayDate.setHours(0, 0, 0, 0);
      const isPast = dayDate < today;
      
      if (isPast) {
        Alert.alert(
          t('habit.locked') || 'Locked',
          t('habit.lockedMessage') || 'This day cannot be edited because it has already passed. Only today and future days can be edited.'
        );
      } else {
        Alert.alert(
          t('habit.locked') || 'Locked',
          t('habit.lockedMessageToday') || 'This day cannot be edited because it has already been marked as completed or missed.'
        );
      }
      return;
    }
    
    if (schedule?.enabled && schedule.scheduleId) {
      // Remove schedule
      try {
        // Delete from database
        const { error } = await supabase
          .from('habit_schedules')
          .delete()
          .eq('id', schedule.scheduleId);
        
        if (error) throw error;
        
        setDaySchedules(prev =>
          prev.map(s =>
            s.day === dayId ? { ...s, enabled: false, time: null, scheduleId: undefined } : s
          )
        );
      } catch (error: any) {
        Alert.alert(t('common.error'), error.message || t('habit.failedToRemoveSchedule'));
      }
    } else {
      // Add schedule - will need time first
      setDaySchedules(prev =>
        prev.map(s =>
          s.day === dayId ? { ...s, enabled: true } : s
        )
      );
      // Prompt for time
      handleTimeSelect(dayId);
    }
  };

  const handleTimeSelect = (dayId: number) => {
    const schedule = daySchedules.find(s => s.day === dayId);
    
    if (!schedule || !schedule.enabled) {
      return; // Can't set time for disabled days
    }
    
    // Check if day is locked - locked days cannot be edited
    if (schedule.isLocked) {
      // Determine the reason for locking
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + dayId);
      dayDate.setHours(0, 0, 0, 0);
      const isPast = dayDate < today;
      
      if (isPast) {
        Alert.alert(
          t('habit.locked') || 'Locked',
          t('habit.lockedMessage') || 'This day cannot be edited because it has already passed. Only today and future days can be edited.'
        );
      } else {
        Alert.alert(
          t('habit.locked') || 'Locked',
          t('habit.lockedMessageToday') || 'This day cannot be edited because it has already been marked as completed or missed.'
        );
      }
      return;
    }
    
    const date = new Date();
    
    if (schedule?.time) {
      const [hours, minutes] = schedule.time.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
    } else {
      date.setHours(8, 0);
    }
    
    setTempTime(date);
    setSelectedDay(dayId);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = async () => {
    if (selectedDay === null) return;
    
    const hours = tempTime.getHours().toString().padStart(2, '0');
    const minutes = tempTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    const schedule = daySchedules.find(s => s.day === selectedDay);
    
    try {
      if (schedule?.scheduleId) {
        // Update existing schedule
        const { error } = await (supabase
          .from('habit_schedules') as any)
          .update({ time: timeString })
          .eq('id', schedule.scheduleId);
        
        if (error) throw error;
        
        // Update UI state
        setDaySchedules(prev =>
          prev.map(s =>
            s.day === selectedDay
              ? { ...s, time: timeString, enabled: true, scheduleId: schedule.scheduleId }
              : s
          )
        );
        
        // Reload habit to ensure UI is in sync
        await loadHabit();
      } else {
        // Check if a schedule already exists for this habit_id and day_of_week
        // This can happen if the UI state is out of sync with the database
        const { data: existingSchedule, error: checkError } = await (supabase
          .from('habit_schedules') as any)
          .select('id')
          .eq('habit_id', habitId)
          .eq('day_of_week', selectedDay)
          .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        if (existingSchedule?.id) {
          // Update existing schedule instead of inserting
          const { error } = await (supabase
            .from('habit_schedules') as any)
            .update({ 
              time: timeString,
              enabled: true 
            })
            .eq('id', existingSchedule.id);
          
          if (error) throw error;
          
          // Update UI state with the existing schedule ID
          setDaySchedules(prev =>
            prev.map(s =>
              s.day === selectedDay
                ? { ...s, time: timeString, enabled: true, scheduleId: existingSchedule.id }
                : s
            )
          );
          
          // Reload habit to ensure UI is in sync
          await loadHabit();
      } else {
        // Create new schedule
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
          const { data: newSchedule, error } = await (supabase
          .from('habit_schedules') as any)
          .insert({
            habit_id: habitId,
            day_of_week: selectedDay,
            time: timeString,
            enabled: true,
            })
            .select()
            .single();
        
        if (error) throw error;
        if (!newSchedule?.id) throw new Error('Failed to create schedule');
      
          // Update UI state with the new schedule ID
      setDaySchedules(prev =>
        prev.map(s =>
          s.day === selectedDay
                ? { ...s, time: timeString, enabled: true, scheduleId: newSchedule.id }
            : s
        )
      );
      
      // Reload habit to ensure UI is in sync
      await loadHabit();
        }
      }
      
      setShowTimePicker(false);
      setSelectedDay(null);
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      showErrorAlert(t('common.error'), error.message || t('habit.failedToUpdateTime'));
    }
  };

  const handleSave = async () => {
    try {
      await HabitService.updateHabit(habitId, {
        name: habitName.trim(),
        description: description.trim() || undefined,
      });
      
      setEditing(false);
      // Reload habit to refresh locked status
      await loadHabit();
      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      showErrorAlert(t('common.error'), error.message || t('habit.failedToUpdate'));
    }
  };

  const handleDelete = () => {
      Alert.alert(
        t('habit.deleteHabit'),
        t('habit.deleteHabitConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await HabitService.deleteHabit(habitId);
                showErrorAlert(t('common.success'), t('habit.habitDeleted'));
                setTimeout(() => router.back(), 1500);
              } catch (error: any) {
                showErrorAlert(t('common.error'), error.message || t('habit.failedToDelete'));
              }
            },
          },
        ]
      );
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return t('habit.setTime');
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const showErrorAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const handleShare = async () => {
    try {
      // Get schedules for the habit
      const schedules = await HabitService.getHabitSchedules(habitId);
      
      const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Format schedules
      const scheduleText = schedules
        .filter(s => s.enabled)
        .map(s => {
          const dayName = DAY_NAMES[s.day_of_week];
          const [hours, minutes] = s.time.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${dayName} at ${displayHour}:${minutes} ${ampm}`;
        })
        .join('\n');

      const shareText = `${habit?.name || 'My Daily Habit'}\n\n${habit?.description ? habit.description + '\n\n' : ''}Schedule:\n${scheduleText}`;

      // Use Share from react-native
      if (Share && Share.share) {
        await Share.share({
          message: shareText,
          title: habit?.name || 'My Daily Habit',
        });
      } else {
        throw new Error('Share API is not available');
      }
    } catch (error: any) {
      console.error('Error sharing habit:', error);
      showErrorAlert(t('common.error'), error.message || 'Failed to share habit');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
        <BottomTabBar />
      </SafeAreaView>
    );
  }

  if (!habit) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Habit not found</Text>
        </View>
        <BottomTabBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {editing ? t('habit.editHabit') : habit.name}
        </Text>
        {!editing && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Share2 size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              setHabitName(habit.name);
              setDescription(habit.description || '');
              // Reload schedules with updated locked status when entering edit mode
              await loadHabit();
              setEditing(true);
            }}>
              <Text style={[styles.editButton, { color: colors.primary }]}>{t('common.edit')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {editing ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>{t('habit.habitName')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={habitName}
                onChangeText={setHabitName}
                placeholder={t('habit.habitNamePlaceholder')}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>{t('habit.description')}</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('habit.descriptionPlaceholder')}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Schedule Section in Edit Mode */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>{t('habit.schedule')}</Text>
              <Text style={[styles.hint, { color: colors.textSecondary, marginBottom: 12 }]}>
                {t('habit.scheduleHint')}
              </Text>
              
              <View style={styles.daysContainer}>
                {daySchedules.map((schedule) => {
                  const isLocked = schedule.isLocked || false;
                  // Locked days cannot be edited at all (no day toggle, no time change)
                  // Only unlocked days can be edited
                  return (
                    <View key={schedule.day} style={styles.scheduleRow}>
                      {/* Day Button */}
                      <TouchableOpacity
                        style={[
                          styles.dayToggle,
                          schedule.enabled && { backgroundColor: colors.primary },
                          { borderColor: colors.border },
                          isLocked && { opacity: 0.5 }
                        ]}
                        onPress={() => handleDayToggle(schedule.day)}
                        disabled={isLocked}
                      >
                        <Text style={[
                          styles.dayToggleText,
                          { color: schedule.enabled ? '#FFFFFF' : colors.text }
                        ]}>
                          {DAYS.find(d => d.id === schedule.day)?.short}
                        </Text>
                      </TouchableOpacity>
                      
                      {/* Time Button */}
                      {schedule.enabled && (
                        <TouchableOpacity
                          style={[
                            styles.timeButton, 
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            isLocked && { opacity: 0.5 }
                          ]}
                          onPress={() => handleTimeSelect(schedule.day)}
                          disabled={isLocked}
                        >
                          <Clock size={16} color={isLocked ? colors.textSecondary : colors.primary} />
                          <Text style={[styles.timeText, { color: schedule.time ? colors.text : colors.textSecondary }]}>
                            {formatTime(schedule.time)}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {isLocked && (
                        <Text style={[styles.lockedLabel, { color: colors.textSecondary }]}>
                          {t('habit.locked') || 'Locked'}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setEditing(false);
                  setHabitName(habit.name);
                  setDescription(habit.description || '');
                  loadHabit();
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {habit.description && (
              <View style={styles.section}>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {habit.description}
                </Text>
              </View>
            )}

            {habit.duration_weeks && (
              <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                <Calendar size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {t('habit.durationWeeks', { weeks: habit.duration_weeks })}
                </Text>
              </View>
            )}

            {/* Schedule Section with Status - View Mode (Read Only) */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>{t('habit.schedule')}</Text>
              <Text style={[styles.hint, { color: colors.textSecondary, marginBottom: 12 }]}>
                {t('habit.scheduleViewHint')}
              </Text>
              
              <View style={styles.daysContainer}>
                {daySchedules.map((schedule) => {
                  const dayInfo = getWeekDays().find(d => d.dayName === DAYS.find(day => day.id === schedule.day)?.label);
                  const dayDate = dayInfo?.date;
                  const dayStatus = dayDate ? weekCompletions.get(dayDate) : null;
                  const isFuture = dayInfo?.isFuture || false;
                  const canMarkStatus = !isFuture; // Only allow marking today or past days
                  
                  return (
                    <View key={schedule.day} style={styles.scheduleRow}>
                      {/* Status Icon at Front - Only Interactive Element in View Mode */}
                      <TouchableOpacity
                        style={[styles.statusIconContainer, isFuture && { opacity: 0.4 }]}
                        onPress={() => {
                          if (!dayDate) return;
                          
                          // Prevent marking future days
                          if (isFuture) {
                            showErrorAlert(
                              t('habit.futureDay'),
                              t('habit.futureDayMessage')
                            );
                            return;
                          }
                          
                          const isLocked = dayStatus === 'completed' || dayStatus === 'missed';
                          
                          if (!isLocked) {
                            // Show action sheet for pending days
                            Alert.alert(
                              t('habit.markDay').replace('{{day}}', DAYS.find(d => d.id === schedule.day)?.label || ''),
                              t('habit.chooseOption'),
                              [
                                { text: t('common.cancel'), style: 'cancel' },
                                {
                                  text: t('habit.completed'),
                                  onPress: () => handleDayStatusChange(dayDate, null),
                                },
                                {
                                  text: t('habit.missed'),
                                  onPress: () => {
                                    HabitService.markHabitMissed(habitId, dayDate).then(() => {
                                      weekCompletions.set(dayDate, 'missed');
                                      setWeekCompletions(new Map(weekCompletions));
                                    }).catch((error: any) => {
                                      showErrorAlert(t('common.error'), error.message || t('habit.failedToMarkMissed'));
                                    });
                                  },
                                  style: 'destructive',
                                },
                              ]
                            );
                          } else {
                            // Toggle between completed and missed for locked days
                            handleDayStatusChange(dayDate, dayStatus);
                          }
                        }}
                        activeOpacity={canMarkStatus ? 0.7 : 1}
                        disabled={!canMarkStatus}
                      >
                        {dayStatus === 'completed' ? (
                          <CheckCircle2 size={28} color={colors.primary} />
                        ) : dayStatus === 'missed' ? (
                          <X size={28} color={colors.error} />
                        ) : (
                          <Circle size={28} color={isFuture ? colors.textSecondary : colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                      
                      {/* Day Button - Read Only Display */}
                      <View
                        style={[
                          styles.dayToggle,
                          schedule.enabled && { backgroundColor: colors.primary },
                          { borderColor: colors.border },
                          { opacity: schedule.enabled ? 1 : 0.5 }
                        ]}
                      >
                        <Text style={[
                          styles.dayToggleText,
                          { color: schedule.enabled ? '#FFFFFF' : colors.text }
                        ]}>
                          {DAYS.find(d => d.id === schedule.day)?.short}
                        </Text>
                      </View>
                      
                      {/* Time Button - Read Only Display */}
                      {schedule.enabled && (
                        <View
                          style={[
                            styles.timeButton, 
                            { backgroundColor: colors.surface, borderColor: colors.border }
                          ]}
                        >
                          <Clock size={16} color={colors.textSecondary} />
                          <Text style={[styles.timeText, { color: schedule.time ? colors.text : colors.textSecondary }]}>
                            {formatTime(schedule.time)}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setEditing(false);
                  setHabitName(habit.name);
                  setDescription(habit.description || '');
                  loadHabit();
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>

            {/* Delete Button - Only in Edit Mode */}
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: colors.error }]}
          onPress={handleDelete}
        >
          <Trash2 size={20} color={colors.error} />
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>{t('habit.deleteHabit')}</Text>
        </TouchableOpacity>
          </>
        )}
      </ScrollView>

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
                    <Text style={[styles.modalButton, { color: colors.primary }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t('habit.selectTime')}</Text>
                  <TouchableOpacity onPress={handleTimeConfirm}>
                    <Text style={[styles.modalButton, { color: colors.primary }]}>{t('common.done')}</Text>
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
            onChange={async (event: any, date?: Date) => {
              if (event.type === 'set' && date && selectedDay !== null) {
                // Update tempTime first
                setTempTime(date);
                // Wait a bit for state to update, then confirm
                setTimeout(async () => {
                  const hours = date.getHours().toString().padStart(2, '0');
                  const minutes = date.getMinutes().toString().padStart(2, '0');
                  const timeString = `${hours}:${minutes}`;
                  
                  const schedule = daySchedules.find(s => s.day === selectedDay);
                  
                  try {
                    if (schedule?.scheduleId) {
                      // Update existing schedule
                      const { error } = await (supabase
                        .from('habit_schedules') as any)
                        .update({ time: timeString })
                        .eq('id', schedule.scheduleId);
                      
                      if (error) throw error;
                      
                      // Update UI state
                      setDaySchedules(prev =>
                        prev.map(s =>
                          s.day === selectedDay
                            ? { ...s, time: timeString, enabled: true, scheduleId: schedule.scheduleId }
                            : s
                        )
                      );
                      
                      // Reload habit to ensure UI is in sync
                      await loadHabit();
                    } else {
                      // Check if a schedule already exists
                      const { data: existingSchedule, error: checkError } = await (supabase
                        .from('habit_schedules') as any)
                        .select('id')
                        .eq('habit_id', habitId)
                        .eq('day_of_week', selectedDay)
                        .maybeSingle();
                      
                      if (checkError && checkError.code !== 'PGRST116') {
                        throw checkError;
                      }
                      
                      if (existingSchedule?.id) {
                        // Update existing schedule
                        const { error } = await (supabase
                          .from('habit_schedules') as any)
                          .update({ 
                            time: timeString,
                            enabled: true 
                          })
                          .eq('id', existingSchedule.id);
                        
                        if (error) throw error;
                        
                        setDaySchedules(prev =>
                          prev.map(s =>
                            s.day === selectedDay
                              ? { ...s, time: timeString, enabled: true, scheduleId: existingSchedule.id }
                              : s
                          )
                        );
                      } else {
                        // Create new schedule
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) throw new Error('User not authenticated');
                        
                        const { data: newSchedule, error } = await (supabase
                          .from('habit_schedules') as any)
                          .insert({
                            habit_id: habitId,
                            day_of_week: selectedDay,
                            time: timeString,
                            enabled: true,
                          })
                          .select()
                          .single();
                        
                        if (error) throw error;
                        if (!newSchedule?.id) throw new Error('Failed to create schedule');
                        
                        setDaySchedules(prev =>
                          prev.map(s =>
                            s.day === selectedDay
                              ? { ...s, time: timeString, enabled: true, scheduleId: newSchedule.id }
                              : s
                          )
                        );
                      }
                      
                      // Reload habit to ensure UI is in sync
                      await loadHabit();
                    }
                    
                    setShowTimePicker(false);
                    setSelectedDay(null);
                  } catch (error: any) {
                    console.error('Error updating schedule:', error);
                    showErrorAlert(t('common.error'), error.message || t('habit.failedToUpdateTime'));
                  }
                }, 100);
              } else if (event.type === 'dismissed') {
                setShowTimePicker(false);
              }
            }}
          />
        ) : null
      )}

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={t('common.success')}
        message={t('habit.habitUpdated')}
        buttonText={t('common.ok') || 'OK'}
        onButtonPress={() => setShowSuccessModal(false)}
      />

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shareButton: {
    padding: 4,
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  daysContainer: {
    gap: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  lockedLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 20,
  },
  deleteButtonText: {
    fontSize: 16,
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
  completionCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  completionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  completionTextContainer: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  completionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  lockedIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lockedMessage: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  lockedMessageText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayStatusCard: {
    width: (Dimensions.get('window').width - 80) / 3.5, // 3.5 cards per row
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 60,
    gap: 12,
  },
  statusIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  dayInfoContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  dayNameText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  todayLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
