import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePaktCreation } from '../src/contexts/PaktCreationContext';
import { useAuth } from '../src/contexts/AuthContext';
import { ResolveService } from '../src/services/resolve.service';
import { MilestoneService } from '../src/services/milestone.service';
import { ReminderService } from '../src/services/reminder.service';
import { NotificationService } from '../src/services/notification.service';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { SuccessModal } from '../src/components/SuccessModal';

export default function ReminderSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const { paktData, resetPaktData } = usePaktCreation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [selectedFrequency, setSelectedFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [selectedTime, setSelectedTime] = useState('morning');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const frequencies = [
    { id: 'daily' as const, label: 'Daily', icon: '📅' },
    { id: 'weekly' as const, label: 'Weekly', icon: '📆' },
    { id: 'custom' as const, label: 'Custom', icon: '⚙️' },
  ];

  const times = [
    { id: 'morning', label: 'Morning', time: '8:00 AM', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '2:00 PM', icon: '☀️' },
    { id: 'evening', label: 'Evening', time: '7:00 PM', icon: '🌙' },
  ];

  const weekDays = [
    { id: 'Monday', short: 'Mon' },
    { id: 'Tuesday', short: 'Tue' },
    { id: 'Wednesday', short: 'Wed' },
    { id: 'Thursday', short: 'Thu' },
    { id: 'Friday', short: 'Fri' },
    { id: 'Saturday', short: 'Sat' },
    { id: 'Sunday', short: 'Sun' },
  ];

  const toggleDay = (dayShort: string) => {
    if (selectedDays.includes(dayShort)) {
      setSelectedDays(selectedDays.filter(d => d !== dayShort));
    } else {
      setSelectedDays([...selectedDays, dayShort]);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a Resolve');
      return;
    }

    if (!paktData.name) {
      Alert.alert('Error', 'Please provide a name for your Resolve');
      return;
    }

    setSaving(true);

    try {
      // 1. Create the Resolve
      const newResolve = await ResolveService.createResolve({
        user_id: user.id,
        name: paktData.name,
        description: paktData.description || '',
        target_outcome: paktData.description || 'Complete this Resolve successfully',
        deadline: paktData.targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Default to 90 days from now
        category: paktData.category || 'other',
        status: 'active',
      });

      console.log('✅ Resolve created:', newResolve.id);

      // 2. Create milestones
      let milestoneCount = 0;
      if (paktData.milestones && paktData.milestones.length > 0) {
        for (const milestone of paktData.milestones) {
          // Use milestone's own dueDate if provided, otherwise use Resolve deadline
          const milestoneDueDate = milestone.dueDate 
            ? new Date(milestone.dueDate).toISOString()
            : (paktData.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
          
          await MilestoneService.createMilestone({
            resolve_id: newResolve.id,
            user_id: user.id,
            name: milestone.title,
            due_date: milestoneDueDate,
            notes: milestone.description || null,
            importance: 3,
            completed: false,
            order_index: milestone.order_index,
          });
          milestoneCount++;
        }
        console.log(`✅ Created ${milestoneCount} milestones`);
      }

      // Create notification for Resolve creation with milestone info
      try {
        await NotificationService.notifyResolveCreated(
          user.id, 
          paktData.name || 'New Resolve', 
          newResolve.id,
          milestoneCount
        );
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail Resolve creation if notification fails
      }

      // 3. Create reminder if enabled
      if (remindersEnabled) {
        const reminder = await ReminderService.createReminder({
          resolve_id: newResolve.id,
          user_id: user.id,
          frequency: selectedFrequency,
          time: times.find(t => t.id === selectedTime)?.time || '8:00 AM',
          days: selectedFrequency === 'custom' ? selectedDays : null,
          enabled: true,
        });
        console.log('✅ Reminder created');
        
        // Schedule device notification for this reminder
        try {
          const { ReminderNotificationService } = await import('../src/services/reminder-notification.service');
          await ReminderNotificationService.scheduleReminderForNewReminder(reminder.id);
          console.log('✅ Reminder notification scheduled');
        } catch (notifError) {
          console.error('Error scheduling reminder notification:', notifError);
          // Don't fail if notification scheduling fails
        }
      }

      // Reset context and show success modal
      resetPaktData();
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error creating Resolve:', error);
      Alert.alert('Error', error.message || 'Failed to create resolve. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Set Reminders</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Stay on track with smart notifications</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.toggleSection, { backgroundColor: colors.surface }]}>
          <View style={styles.toggleHeader}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>Enable Reminders</Text>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
            Get notified to check in on your progress
          </Text>
        </View>

        {remindersEnabled && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequency</Text>
              <View style={styles.optionsGrid}>
                {frequencies.map((freq) => (
                  <TouchableOpacity
                    key={freq.id}
                    style={[
                      styles.optionCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      selectedFrequency === freq.id && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => setSelectedFrequency(freq.id)}
                  >
                    <Text style={styles.optionIcon}>{freq.icon}</Text>
                    <Text style={[
                      styles.optionLabel,
                      { color: colors.textSecondary },
                      selectedFrequency === freq.id && { color: colors.primary, fontWeight: '600' },
                    ]}>
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedFrequency === 'custom' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Days</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Choose which days of the week you want to receive notifications
                </Text>
                <View style={styles.daysGrid}>
                  {weekDays.map((day) => {
                    const isSelected = selectedDays.includes(day.short);
                    return (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          { 
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => toggleDay(day.short)}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}>
                          {day.short}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedDays.length === 0 && selectedFrequency === 'custom' && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    Please select at least one day
                  </Text>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferred Time</Text>
              {times.map((time) => (
                <TouchableOpacity
                  key={time.id}
                  style={[
                    styles.timeCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedTime === time.id && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setSelectedTime(time.id)}
                >
                  <Text style={styles.timeIcon}>{time.icon}</Text>
                  <View style={styles.timeInfo}>
                    <Text style={[
                      styles.timeLabel,
                      { color: colors.text },
                      selectedTime === time.id && { color: colors.primary, fontWeight: '600' },
                    ]}>
                      {time.label}
                    </Text>
                    <Text style={[styles.timeValue, { color: colors.textSecondary }]}>{time.time}</Text>
                  </View>
                  {selectedTime === time.id && (
                    <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                💡 You can always adjust these settings later in your dashboard
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.completeButton, 
            (saving || (selectedFrequency === 'custom' && selectedDays.length === 0)) && styles.completeButtonDisabled
          ]}
          onPress={handleComplete}
          disabled={saving || (selectedFrequency === 'custom' && selectedDays.length === 0)}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.completeButtonText}>
              {remindersEnabled ? 'Complete Setup' : 'Skip Reminders'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <SuccessModal
        visible={showSuccessModal}
        title={t('resolveCreation.successTitle')}
        message={t('resolveCreation.successMessage', { resolveName: paktData.name })}
        buttonText={t('resolveCreation.viewDashboard')}
        onButtonPress={() => {
          setShowSuccessModal(false);
          router.push('/dashboard');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F6',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    fontSize: 16,
    color: '#9163F2',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3C2B63',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  toggleSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C2B63',
  },
  toggleSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C2B63',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedCard: {
    borderColor: '#9163F2',
    backgroundColor: '#F5F0FF',
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedLabel: {
    color: '#9163F2',
    fontWeight: '600',
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedTimeCard: {
    borderColor: '#9163F2',
    backgroundColor: '#F5F0FF',
  },
  timeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  timeInfo: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  selectedTimeLabel: {
    color: '#9163F2',
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9163F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E8DEFF',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: '#9163F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 70,
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

