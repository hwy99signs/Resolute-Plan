import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Save, Trash2, Plus, X, Edit2 } from 'lucide-react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { ResolveService } from '../src/services/resolve.service';
import { MilestoneService } from '../src/services/milestone.service';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
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
  name: string;
  due_date: string;
  notes: string | null;
  importance: number;
  completed: boolean;
  order_index: number;
}

export default function EditPaktScreen() {
  const router = useRouter();
  const { paktId } = useLocalSearchParams();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paktName, setPaktName] = useState('');
  const [description, setDescription] = useState('');
  const [targetOutcome, setTargetOutcome] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [category, setCategory] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [milestoneNotes, setMilestoneNotes] = useState('');

  useEffect(() => {
    loadPakt();
  }, []);

  const loadPakt = async () => {
    try {
      setLoading(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:59',message:'loadPakt entry',data:{paktId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const Resolve = await ResolveService.getResolve(paktId as string);
      // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:61',message:'ResolveService.getResolve result',data:{Resolve:Resolve?{id:Resolve.id,name:Resolve.name}:null,hasResolve:!!Resolve},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (Resolve) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:63',message:'Before accessing Resolve properties',data:{ResolveExists:!!Resolve},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setPaktName(Resolve.name);
        setDescription(Resolve.description);
        setTargetOutcome(Resolve.target_outcome);
        setDeadline(new Date(Resolve.deadline));
        setCategory(Resolve.category);
        
        // Load milestones
        const paktMilestones = await MilestoneService.getPaktMilestones(paktId as string);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:70',message:'Milestones loaded',data:{milestoneCount:paktMilestones.length,milestones:paktMilestones.map(m=>({id:m.id,name:m.name,due_date:m.due_date,notes:m.notes}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        setMilestones(paktMilestones.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:73',message:'loadPakt error',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Error loading Resolve:', error);
      Alert.alert('Error', 'Failed to load Resolve');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!paktName.trim()) {
      Alert.alert('Error', 'Please enter a Resolve name');
      return;
    }

    try {
      setSaving(true);
      // Update Resolve
      await ResolveService.updateResolve(paktId as string, {
        name: paktName.trim(),
        description: description.trim(),
        target_outcome: targetOutcome.trim() || description.trim(),
        deadline: deadline.toISOString(),
        category: category || 'other',
      });
      
      // Milestone changes are saved in real-time, so we just need to reload
      await loadPakt();
      
      Alert.alert('Success', 'Resolve updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating Resolve:', error);
      Alert.alert('Error', 'Failed to update Resolve');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMilestone = () => {
    setEditingMilestone(null);
    setMilestoneName('');
    setMilestoneDueDate(new Date());
    setMilestoneNotes('');
    setShowMilestoneModal(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:119',message:'handleEditMilestone entry',data:{milestoneId:milestone.id,milestoneName:milestone.name,due_date:milestone.due_date,due_dateType:typeof milestone.due_date,notes:milestone.notes,hasAllProps:!!(milestone.id&&milestone.name&&milestone.due_date)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
    setEditingMilestone(milestone);
    setMilestoneName(milestone.name);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:123',message:'Before date parsing',data:{due_date:milestone.due_date,due_dateValid:!!milestone.due_date},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const parsedDate = new Date(milestone.due_date);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:125',message:'After date parsing',data:{parsedDate:parsedDate.toISOString(),isValid:!isNaN(parsedDate.getTime())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setMilestoneDueDate(parsedDate);
    setMilestoneNotes(milestone.notes || '');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:128',message:'Before opening modal',data:{showMilestoneModal:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    setShowMilestoneModal(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:130',message:'After opening modal',data:{showMilestoneModal:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:132',message:'handleEditMilestone error',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('Error in handleEditMilestone:', error);
      Alert.alert('Error', 'Failed to open milestone');
    }
  };

  const handleSaveMilestone = async () => {
    if (!milestoneName.trim()) {
      Alert.alert('Error', 'Please enter a milestone name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Validate milestone deadline doesn't exceed Resolve deadline
    if (milestoneDueDate > deadline) {
      Alert.alert('Error', 'Milestone deadline cannot exceed Resolve deadline');
      return;
    }

    try {
      if (editingMilestone) {
        // Update existing milestone
        await MilestoneService.updateMilestone(editingMilestone.id, {
          name: milestoneName.trim(),
          due_date: milestoneDueDate.toISOString(),
          notes: milestoneNotes.trim() || null,
        });
      } else {
        // Create new milestone
        const maxOrderIndex = milestones.length > 0 
          ? Math.max(...milestones.map(m => m.order_index || 0))
          : -1;
        
        await MilestoneService.createMilestone({
          resolve_id: paktId as string,
          user_id: user.id,
          name: milestoneName.trim(),
          due_date: milestoneDueDate.toISOString(),
          notes: milestoneNotes.trim() || null,
          importance: 3,
          completed: false,
          order_index: maxOrderIndex + 1,
        });
      }
      
      setShowMilestoneModal(false);
      await loadPakt(); // Reload to get updated milestones
    } catch (error: any) {
      console.error('Error saving milestone:', error);
      Alert.alert('Error', error.message || 'Failed to save milestone');
    }
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    Alert.alert(
      t('resolve.deleteMilestone'),
      t('resolve.deleteMilestoneConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await MilestoneService.deleteMilestone(milestoneId);
              await loadPakt(); // Reload to get updated milestones
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete milestone');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Resolve',
      'Are you sure you want to delete this Resolve? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ResolveService.deleteResolve(paktId as string);
              Alert.alert('Success', 'Resolve deleted successfully', [
                { text: 'OK', onPress: () => router.replace('/dashboard') }
              ]);
            } catch (error) {
              console.error('Error deleting Resolve:', error);
              Alert.alert('Error', 'Failed to delete Resolve');
            }
          },
        },
      ]
    );
  };

  /*
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };
  */

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: colors.background },
    input: { ...styles.input, backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
    textArea: { ...styles.textArea },
    dateButton: { ...styles.dateButton, backgroundColor: colors.surface, borderColor: colors.border },
    dateButtonText: { ...styles.dateButtonText, color: colors.text },
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Edit Resolve</Text>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Trash2 size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.inputSection}>
          <Text style={styles.label}>Resolve Name *</Text>
          <TextInput
            style={dynamicStyles.input}
            placeholder="e.g., Run my first 5K"
            placeholderTextColor={colors.textSecondary}
            value={paktName}
            onChangeText={setPaktName}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[dynamicStyles.input, dynamicStyles.textArea]}
            placeholder="Add more details about your goal..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Target Outcome</Text>
          <TextInput
            style={dynamicStyles.input}
            placeholder="What do you want to achieve?"
            placeholderTextColor={colors.textSecondary}
            value={targetOutcome}
            onChangeText={setTargetOutcome}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Deadline</Text>
          <View style={dynamicStyles.dateButton}>
            <Calendar size={20} color={colors.primary} />
            <Text style={dynamicStyles.dateButtonText}>{formatDate(deadline)}</Text>
          </View>
        </View>

        {/* Milestones Section */}
        <View style={styles.inputSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>{t('resolve.milestones')}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddMilestone}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {milestones.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {t('resolve.noMilestones')}
              </Text>
            </View>
          ) : (
            <View style={styles.milestonesList}>
              {milestones.map((milestone, index) => (
                <View key={milestone.id} style={[styles.milestoneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.milestoneHeader}>
                    <View style={styles.milestoneNumber}>
                      <Text style={[styles.milestoneNumberText, { color: colors.primary }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.milestoneContent}>
                      <Text style={[styles.milestoneName, { color: colors.text }]}>
                        {milestone.name}
                      </Text>
                      <Text style={[styles.milestoneDate, { color: colors.textSecondary }]}>
                        {formatDate(new Date(milestone.due_date))}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.milestoneActions}>
                    <TouchableOpacity
                      style={styles.milestoneActionButton}
                      onPress={() => handleEditMilestone(milestone)}
                    >
                      <Edit2 size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.milestoneActionButton}
                      onPress={() => handleDeleteMilestone(milestone.id)}
                    >
                      <Trash2 size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Milestone Edit Modal */}
      <Modal
        visible={showMilestoneModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit-pakt.tsx:389',message:'Modal onRequestClose',data:{showMilestoneModal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          setShowMilestoneModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingMilestone ? t('resolve.editMilestone') : t('resolve.addMilestone')}
              </Text>
              <TouchableOpacity onPress={() => setShowMilestoneModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.text }]}>
                  {t('resolve.milestoneName')} *
                </Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={milestoneName}
                  onChangeText={setMilestoneName}
                  placeholder={t('resolve.milestoneNamePlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.text }]}>
                  {t('resolve.dueDate')} *
                </Text>
          <TouchableOpacity
                  style={[styles.modalDateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={colors.primary} />
                  <Text style={[styles.modalDateText, { color: colors.text }]}>
                    {formatDate(milestoneDueDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.text }]}>
                  {t('resolve.notes')}
                </Text>
                <TextInput
                  style={[styles.modalTextArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={milestoneNotes}
                  onChangeText={setMilestoneNotes}
                  placeholder={t('resolve.notesPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalCancelButton, { borderColor: colors.border }]}
                  onPress={() => setShowMilestoneModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.text }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveMilestone}
                >
                  <Text style={styles.modalSaveText}>{t('common.save')}</Text>
          </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Date Picker for Milestone */}
          {showDatePicker && (
          Platform.OS === 'ios' && DateTimePicker ? (
            <View style={styles.datePickerContainer}>
              <View style={[styles.datePickerHeader, { backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.datePickerButton, { color: colors.primary }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.datePickerTitle, { color: colors.text }]}>
                  {t('resolve.selectDate')}
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.datePickerButton, { color: colors.primary }]}>
                    {t('common.done')}
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={milestoneDueDate}
                mode="date"
                display="spinner"
                onChange={(event: any, date?: Date) => {
                  if (date) setMilestoneDueDate(date);
                }}
                minimumDate={new Date()}
                maximumDate={deadline}
                textColor={colors.text}
              />
            </View>
          ) : Platform.OS === 'android' && DateTimePicker ? (
            <DateTimePicker
              value={milestoneDueDate}
              mode="date"
              display="default"
              onChange={(event: any, date?: Date) => {
                setShowDatePicker(false);
                if (date) setMilestoneDueDate(date);
              }}
              minimumDate={new Date()}
              maximumDate={deadline}
            />
          ) : null
          )}
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#9163F2',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9163F2',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#9163F2',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(145, 99, 242, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  milestonesList: {
    gap: 12,
  },
  milestoneCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  milestoneNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(145, 99, 242, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  milestoneDate: {
    fontSize: 14,
  },
  milestoneActions: {
    flexDirection: 'row',
    gap: 8,
  },
  milestoneActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  modalTextArea: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  modalDateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerButton: {
    fontSize: 16,
    fontWeight: '600',
  },
});
