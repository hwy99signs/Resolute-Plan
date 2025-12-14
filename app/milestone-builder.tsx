import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePaktCreation } from '../src/contexts/PaktCreationContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { Calendar } from 'lucide-react-native';
import { ResolveService } from '../src/services/resolve.service';
import { MilestoneService } from '../src/services/milestone.service';
import { useAuth } from '../src/contexts/AuthContext';

// Conditional import for DateTimePicker
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  console.warn('DateTimePicker not available, using fallback');
}

interface Milestone {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
}

export default function MilestoneBuilder() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { paktData, updatePaktData } = usePaktCreation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const resolveId = (params.resolveId || params.paktId) as string; // Support both for backward compatibility
  const isEditingExisting = !!resolveId;
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', title: '', completed: false },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [resolveDeadline, setResolveDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);
  
  // Note: We don't load existing milestones here - this screen is for adding NEW milestones only
  // Existing milestones can be viewed/edited on the detail/edit screens
  
  // Load Resolve deadline for validation
  useEffect(() => {
    const loadResolveDeadline = async () => {
      if (resolveId) {
        try {
          const Resolve = await ResolveService.getResolve(resolveId);
          if (Resolve?.deadline) {
            setResolveDeadline(new Date(Resolve.deadline));
          }
        } catch (error) {
          console.error('Error loading Resolve deadline:', error);
        }
      } else if (paktData.targetDate) {
        setResolveDeadline(new Date(paktData.targetDate));
      }
    };
    loadResolveDeadline();
  }, [resolveId, paktData.targetDate]);

  const addMilestone = () => {
    if (currentInput.trim()) {
      setMilestones([
        ...milestones,
        { id: Date.now().toString(), title: currentInput, completed: false },
      ]);
      setCurrentInput('');
    }
  };

  const updateMilestoneDueDate = (milestoneId: string, date: Date) => {
    // Validate that milestone deadline doesn't exceed Resolve deadline
    if (resolveDeadline && date > resolveDeadline) {
      Alert.alert(
        t('milestoneBuilder.invalidDate'),
        t('milestoneBuilder.milestoneExceedsDeadline')
      );
      return;
    }
    
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, dueDate: date.toISOString().split('T')[0] }
        : m
    ));
    setShowDatePicker(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('milestoneBuilder.selectDeadline');
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleContinue = async () => {
    const validMilestones = milestones.filter(m => m.title.trim() && m.dueDate);
    
    // Validate all milestones have deadlines
    const milestonesWithoutDeadlines = milestones.filter(m => m.title.trim() && !m.dueDate);
    if (milestonesWithoutDeadlines.length > 0) {
      Alert.alert(
        'Missing Deadlines',
        'Please set a deadline for all milestones. Each milestone must have its own deadline date.'
      );
      return;
    }
    
    // Validate milestone deadlines don't exceed Resolve deadline
    if (resolveDeadline) {
      const invalidMilestones = validMilestones.filter(m => {
        if (!m.dueDate) return false;
        return new Date(m.dueDate) > resolveDeadline;
      });
      
      if (invalidMilestones.length > 0) {
        Alert.alert(
            t('milestoneBuilder.invalidDeadlines'),
            t('milestoneBuilder.someExceedDeadline')
        );
        return;
      }
    }
    
    if (validMilestones.length === 0) {
      Alert.alert('Error', 'Please add at least one milestone');
      return;
    }

    // If editing existing Resolve, save milestones directly to database
    if (isEditingExisting && resolveId && user) {
      try {
        setSaving(true);
        
        // Get existing milestones to determine next order_index
        const existingMilestones = await MilestoneService.getPaktMilestones(resolveId);
        const maxOrderIndex = existingMilestones.length > 0 
          ? Math.max(...existingMilestones.map(m => m.order_index || 0))
          : -1;
        
        // Create all valid milestones (they're all new since we don't load existing ones)
        for (let i = 0; i < validMilestones.length; i++) {
          const milestone = validMilestones[i];
          await MilestoneService.createMilestone({
            resolve_id: resolveId,
            user_id: user.id,
            name: milestone.title.trim(),
            due_date: milestone.dueDate ? new Date(milestone.dueDate).toISOString() : new Date().toISOString(),
            notes: null,
            importance: 3,
            completed: false,
            order_index: maxOrderIndex + 1 + i,
          });
        }
        
        setSaving(false);
        Alert.alert('Success', 'Milestones added successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } catch (error: any) {
        setSaving(false);
        console.error('Error saving milestones:', error);
        Alert.alert('Error', error.message || 'Failed to save milestones');
      }
      return;
    }
    
    // For new Resolve creation, continue with normal flow
    if (validMilestones.length > 0) {
      // Convert to format expected by context
      const formattedMilestones = validMilestones.map((m, index) => ({
        title: m.title.trim(),
        dueDate: m.dueDate ? new Date(m.dueDate).toISOString() : undefined,
        completed: false,
        order_index: index,
      }));
      updatePaktData({ milestones: formattedMilestones });
      router.push('/reminder-setup');
    }
  };

  const validMilestones = milestones.filter(m => m.title.trim());

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditingExisting ? 'Add Milestones' : t('milestoneBuilder.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isEditingExisting ? 'Add new milestones to your Resolve' : t('milestoneBuilder.subtitle')}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.milestonesList}>
          {milestones.map((milestone, index) => (
            <View 
              key={milestone.id} 
              style={[styles.milestoneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.milestoneHeader}>
                <View style={styles.milestoneNumber}>
                  <Text style={styles.milestoneNumberText}>{index + 1}</Text>
                </View>
                <TouchableOpacity onPress={() => removeMilestone(milestone.id)}>
                  <Text style={[styles.removeButton, { color: colors.error }]}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={[styles.milestoneTitleInput, { color: colors.text, borderColor: colors.border }]}
                placeholder={t('milestoneBuilder.milestoneName')}
                placeholderTextColor={colors.textSecondary}
                value={milestone.title}
                onChangeText={(text) => {
                  setMilestones(milestones.map(m => 
                    m.id === milestone.id ? { ...m, title: text } : m
                  ));
                }}
              />
              
              <TouchableOpacity
                style={[styles.deadlineButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  setTempDate(milestone.dueDate ? new Date(milestone.dueDate) : new Date());
                  setShowDatePicker(milestone.id);
                }}
              >
                <Calendar size={18} color={colors.primary} />
                <Text style={[
                  styles.deadlineText,
                  { color: milestone.dueDate ? colors.text : colors.textSecondary }
                ]}>
                  {formatDate(milestone.dueDate)}
                </Text>
              </TouchableOpacity>
              
              {milestone.dueDate && resolveDeadline && new Date(milestone.dueDate) > resolveDeadline && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  ⚠️ Deadline exceeds Resolve deadline
                </Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder={t('milestoneBuilder.addMilestone')}
            placeholderTextColor={colors.textSecondary}
            value={currentInput}
            onChangeText={setCurrentInput}
            onSubmitEditing={addMilestone}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={addMilestone}>
            <Text style={styles.addButtonText}>+ {t('milestoneBuilder.add')}</Text>
          </TouchableOpacity>
        </View>
        
        {resolveDeadline && (
          <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              📅 Resolve Deadline: {resolveDeadline.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary, fontSize: 12, marginTop: 4 }]}>
              {t('milestoneBuilder.allMilestonesBefore')}
            </Text>
          </View>
        )}

        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>📋 Example Milestones</Text>
          <Text style={styles.exampleItem}>• Research training programs</Text>
          <Text style={styles.exampleItem}>• Complete first week of training</Text>
          <Text style={styles.exampleItem}>• Run 5K without stopping</Text>
          <Text style={styles.exampleItem}>• Register for race</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 {t('milestoneBuilder.aimForMilestones')}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {validMilestones.length} {t('milestoneBuilder.milestonesAdded')}
          {validMilestones.length > 0 && milestones.some(m => m.title.trim() && !m.dueDate) && (
            <Text style={{ color: colors.error }}> - {t('milestoneBuilder.setDeadlineForAll')}</Text>
          )}
        </Text>
        <TouchableOpacity
          style={[
            styles.continueButton, 
            (validMilestones.length === 0 || milestones.some(m => m.title.trim() && !m.dueDate) || saving) && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={validMilestones.length === 0 || milestones.some(m => m.title.trim() && !m.dueDate) || saving}
        >
          <Text style={styles.continueButtonText}>
            {saving ? 'Saving...' : (isEditingExisting ? 'Save Milestones' : t('common.continue'))}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        Platform.OS === 'ios' && DateTimePicker ? (
          <Modal
            visible={!!showDatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePicker(null)}
          >
            <View style={styles.datePickerModal}>
              <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                    <Text style={[styles.datePickerCancel, { color: colors.primary }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('milestoneBuilder.selectDeadline')}</Text>
                  <TouchableOpacity onPress={() => {
                    if (showDatePicker) {
                      updateMilestoneDueDate(showDatePicker, tempDate);
                    }
                  }}>
                    <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done')}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setTempDate(date);
                  }}
                  minimumDate={new Date()}
                  maximumDate={resolveDeadline || undefined}
                  textColor={colors.text}
                />
              </View>
            </View>
          </Modal>
        ) : Platform.OS === 'android' && DateTimePicker ? (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(null);
              if (date && showDatePicker) {
                updateMilestoneDueDate(showDatePicker, date);
              }
            }}
            minimumDate={new Date()}
            maximumDate={resolveDeadline || undefined}
          />
        ) : (
          <Modal
            visible={!!showDatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePicker(null)}
          >
            <View style={styles.datePickerModal}>
              <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                    <Text style={[styles.datePickerCancel, { color: colors.primary }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('milestoneBuilder.selectDeadline')}</Text>
                  <TouchableOpacity onPress={() => {
                    if (showDatePicker) {
                      updateMilestoneDueDate(showDatePicker, tempDate);
                    }
                  }}>
                    <Text style={[styles.datePickerDone, { color: colors.primary }]}>{t('common.done')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.fallbackDateInput}>
                  <Text style={[styles.fallbackLabel, { color: colors.text }]}>Date (YYYY-MM-DD):</Text>
                  <TextInput
                    style={[styles.fallbackInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={tempDate.toISOString().split('T')[0]}
                    onChangeText={(text) => {
                      const date = new Date(text);
                      if (!isNaN(date.getTime())) {
                        setTempDate(date);
                      }
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {resolveDeadline && (
                    <Text style={[styles.fallbackHint, { color: colors.textSecondary }]}>
                      Must be before {resolveDeadline.toISOString().split('T')[0]}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Modal>
        )
      )}
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
    padding: 24,
  },
  milestonesList: {
    marginBottom: 24,
  },
  milestoneCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  milestoneNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9163F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  milestoneTitleInput: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  deadlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  deadlineText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  removeButton: {
    fontSize: 20,
    paddingHorizontal: 8,
  },
  inputSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#9163F2',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  examplesSection: {
    backgroundColor: '#E8DEFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C2B63',
    marginBottom: 8,
  },
  exampleItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: '#9163F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  datePickerCancel: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackDateInput: {
    padding: 20,
  },
  fallbackLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  fallbackInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  fallbackHint: {
    fontSize: 12,
    marginTop: 8,
  },
});

