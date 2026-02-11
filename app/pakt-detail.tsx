import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Calendar, Clock, Target, CheckCircle, Circle, Edit, Trash2, Share2, MoreVertical } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { ResolveService } from '../src/services/resolve.service';
import { MilestoneService } from '../src/services/milestone.service';
import { NotificationService } from '../src/services/notification.service';
import { AchievementService } from '../src/services/achievement.service';
import { useResolves } from '../src/hooks/useResolves';
import { ShareService } from '../src/services/share.service';
import { useLanguage } from '../src/contexts/LanguageContext';
import { translateCategory, translateResolveName } from '../src/utils/translations';
import { DeleteConfirmationModal } from '../src/components/DeleteConfirmationModal';
import { SuccessModal } from '../src/components/SuccessModal';
import { ErrorModal } from '../src/components/ErrorModal';

// Conditional import for DateTimePicker
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  console.warn('DateTimePicker not available, using fallback');
}

export default function PaktDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { resolves: Resolves, refetch } = useResolves();
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [Resolve, setPakt] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [togglingMilestone, setTogglingMilestone] = useState<string | null>(null);
  const [editingMilestoneDeadline, setEditingMilestoneDeadline] = useState<string | null>(null);
  const [milestoneDeadlineDate, setMilestoneDeadlineDate] = useState(new Date());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  
  // Reload milestones when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const reloadMilestones = async () => {
        const paktId = params.id as string || Resolve?.id;
        if (!paktId) return;
        try {
          const paktMilestones = await MilestoneService.getPaktMilestones(paktId);
          setMilestones(paktMilestones.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)));
        } catch (error) {
          console.error('Error reloading milestones:', error);
        }
      };
      reloadMilestones();
    }, [params.id, Resolve?.id])
  );
  
  // Find Resolve from params or use first Resolve as fallback
  useEffect(() => {
    const loadPakt = async () => {
      try {
        setLoading(true);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pakt-detail.tsx:51',message:'loadPakt entry',data:{paktId:params.id,ResolvesType:typeof Resolves,ResolvesIsArray:Array.isArray(Resolves),ResolvesLength:Resolves?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const paktId = params.id as string;
        if (paktId) {
          try {
            const fetchedPakt = await ResolveService.getResolve(paktId);
            if (fetchedPakt) {
              setPakt(fetchedPakt);
              setSelectedDate(new Date(fetchedPakt.deadline));
              // Load milestones separately
              const paktMilestones = await MilestoneService.getPaktMilestones(paktId);
              // Sort by order_index
              setMilestones(paktMilestones.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)));
            } else {
              // Resolve not found, try to navigate back or show error
              setShowNotFoundModal(true);
            }
          } catch (paktError: any) {
            // Handle specific "not found" error
            if (paktError?.code === 'PGRST116' || paktError?.message?.includes('0 rows')) {
              setShowNotFoundModal(true);
            } else {
              throw paktError; // Re-throw other errors
            }
          }
        } else if (Resolves && Resolves.length > 0) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pakt-detail.tsx:77',message:'Using fallback Resolve',data:{ResolvesLength:Resolves.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          // Fallback to first Resolve if no ID provided
          const firstPakt = Resolves[0];
          setPakt(firstPakt);
          setSelectedDate(new Date(firstPakt.deadline));
          if (firstPakt.id) {
            const paktMilestones = await MilestoneService.getPaktMilestones(firstPakt.id);
            // Sort by order_index
            setMilestones(paktMilestones.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)));
          }
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6d153e82-0f01-42bb-8769-6bca51679f09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pakt-detail.tsx:89',message:'loadPakt error',data:{error:error instanceof Error?error.message:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('Error loading Resolve:', error);
        Alert.alert('Error', 'Failed to load Resolve details');
      } finally {
        setLoading(false);
      }
    };

    if ((Resolves && Resolves.length > 0) || params.id) {
      loadPakt();
    }
  }, [params.id, Resolves]);

  const handleDateChange = async (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date && Resolve && user) {
      setSelectedDate(date);
      
      try {
        setSaving(true);
        await ResolveService.updateResolve(Resolve.id, {
          deadline: date.toISOString(),
        });
        setPakt({ ...Resolve, deadline: date.toISOString() });
        await refetch();
        
        if (Platform.OS === 'ios') {
          setShowDatePicker(false);
        }
      } catch (error) {
        console.error('Error updating deadline:', error);
        Alert.alert('Error', 'Failed to update deadline');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading || !Resolve) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('resolve.loadingDetails')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedMilestones = milestones.filter((m: any) => m.completed).length;
  const totalMilestones = milestones.length;

  // Handle share Resolve
  const handleSharePakt = async () => {
    if (!Resolve) return;
    
    try {
      await ShareService.sharePakt({
        name: Resolve.name,
        description: Resolve.description || '',
        category: Resolve.category,
        progress: Resolve.progress || 0,
        milestones: milestones.map((m: any) => ({
          name: m.name,
          completed: m.completed,
        })),
      });
    } catch (error) {
      console.error('Error sharing Resolve:', error);
      Alert.alert('Error', 'Failed to share Resolve');
    }
  };

  // Handle copy link
  const handleCopyLink = async () => {
    if (!Resolve) return;
    
    try {
      await ShareService.copyLink(Resolve.id);
      Alert.alert('Success', t('share.copied'));
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', 'Failed to copy link');
    }
  };
  
  // Handle milestone toggle
  const handleToggleMilestone = async (milestoneId: string, currentStatus: boolean) => {
    if (!user || !Resolve) return;
    
    try {
      setTogglingMilestone(milestoneId);
      const newStatus = !currentStatus;
      await MilestoneService.toggleMilestone(milestoneId, newStatus);
      
      // Update local state
      setMilestones(prev => prev.map(m => 
        m.id === milestoneId 
          ? { ...m, completed: newStatus, completed_at: newStatus ? new Date().toISOString() : null }
          : m
      ));
      
      // Refresh Resolve to get updated progress (database trigger should update it)
      const updatedPakt = await ResolveService.getResolve(Resolve.id);
      if (updatedPakt) {
        setPakt(updatedPakt);
      }
      
      // Refresh Resolves list
      await refetch();
      
      // Create notification for milestone achievement
      if (newStatus) {
        const milestone = milestones.find((m: any) => m.id === milestoneId);
        if (milestone && Resolve) {
          try {
            await NotificationService.notifyMilestoneAchieved(
              user.id,
              milestone.name,
              Resolve.name,
              milestoneId,
              Resolve.id
            );
            
            // Check for milestone-based achievements
            const allMilestones = await MilestoneService.getUserMilestones(user.id);
            const completedMilestonesCount = allMilestones.filter((m: any) => m.completed).length;
            const newAchievements = await AchievementService.checkMilestoneAchievements(
              user.id,
              completedMilestonesCount
            );
            
            // Show achievement notifications (already sent by AchievementService)
            if (newAchievements.length > 0) {
              console.log(`Earned ${newAchievements.length} achievement(s)!`);
            }
          } catch (notifError) {
            console.error('Error creating notification:', notifError);
          }
        }
      }
      
      if (newStatus && updatedPakt?.progress === 100) {
        setShowCompletionModal(true);
        
        // Create notification for Resolve completion
        try {
          await NotificationService.notifyResolveCompleted(user.id, Resolve.name, Resolve.id);
          
          // Check for Resolve-based achievements
          const allPakts = await ResolveService.getUserResolves(user.id);
          const completedPaktsCount = allPakts.filter((p: any) => p.progress === 100).length;
          const newAchievements = await AchievementService.checkPaktAchievements(
            user.id,
            completedPaktsCount
          );
          
          // Show achievement notifications (already sent by AchievementService)
          if (newAchievements.length > 0) {
            console.log(`Earned ${newAchievements.length} achievement(s)!`);
          }
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }
    } catch (error) {
      console.error('Error toggling milestone:', error);
      Alert.alert('Error', 'Failed to update milestone');
    } finally {
      setTogglingMilestone(null);
    }
  };

  // Handle milestone deadline update
  const handleUpdateMilestoneDeadline = async (milestoneId: string, date: Date) => {
    if (!user || !Resolve) return;
    
    // Validate milestone deadline doesn't exceed Resolve deadline
    if (Resolve.deadline && date > new Date(Resolve.deadline)) {
      Alert.alert(
        'Invalid Date',
        `Milestone deadline cannot exceed the Resolve deadline of ${new Date(Resolve.deadline).toLocaleDateString()}. Please select an earlier date.`
      );
      return;
    }
    
    try {
      setSaving(true);
      await MilestoneService.updateMilestone(milestoneId, {
        due_date: date.toISOString(),
      });
      
      // Update local state
      setMilestones(prev => prev.map(m => 
        m.id === milestoneId 
          ? { ...m, due_date: date.toISOString() }
          : m
      ));
      
      setEditingMilestoneDeadline(null);
    } catch (error) {
      console.error('Error updating milestone deadline:', error);
      Alert.alert('Error', 'Failed to update milestone deadline');
    } finally {
      setSaving(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return '#96E6B3';
    if (progress >= 50) return '#FFD88A';
    if (progress >= 25) return '#9163F2';
    return '#FF6B6B';
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'No deadline';
    return new Date(deadline).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Handle delete Resolve
  const handleDeletePakt = () => {
    if (!user || !Resolve) return;
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePakt = async () => {
    if (!user || !Resolve) return;
    
    try {
      setShowDeleteConfirm(false);
              await ResolveService.deleteResolve(Resolve.id);
              
              // Refresh Resolves list
              await refetch();
              
              // Navigate back
              router.back();
            } catch (error) {
              console.error('Error deleting Resolve:', error);
      Alert.alert(t('common.error'), t('resolve.deleteError'));
            }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Resolve Details</Text>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <MoreVertical size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.paktName, { color: colors.text }]}>{translateResolveName(Resolve.name)}</Text>
              <Text style={[styles.paktCategory, { color: colors.textSecondary }]}>{translateCategory(Resolve.category)}</Text>
            </View>
            <View style={[styles.progressCircle, { borderColor: getProgressColor(Resolve.progress || 0) }]}>
              <Text style={[styles.progressText, { color: getProgressColor(Resolve.progress || 0) }]}>
                {Resolve.progress || 0}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View 
                style={[
                styles.progressBar, 
                { 
                  width: `${Resolve.progress || 0}%`,
                  backgroundColor: getProgressColor(Resolve.progress || 0)
                }
              ]}
            />
          </View>

          <Text style={[styles.milestoneProgress, { color: colors.textSecondary }]}>
            {completedMilestones} of {totalMilestones} milestones completed
            {totalMilestones === 0 && ' - Add milestones to track progress'}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{Resolve.description || 'No description'}</Text>
        </View>

        {/* Target Outcome */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Target Outcome</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Target size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>{Resolve.target_outcome || 'No target outcome'}</Text>
          </View>
        </View>

        {/* Deadline */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Deadline</Text>
          <TouchableOpacity 
            style={[styles.infoCard, { backgroundColor: colors.surface }]}
            onPress={() => setShowDatePicker(true)}
            disabled={saving}
          >
            <Calendar size={20} color="#FFD88A" />
            <Text style={[styles.infoText, { color: colors.text, flex: 1 }]}>
              {formatDeadline(Resolve.deadline)}
            </Text>
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Edit size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reminders</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Clock size={20} color="#96E6B3" />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {Resolve.reminders?.frequency ? 
                Resolve.reminders.frequency.charAt(0).toUpperCase() + Resolve.reminders.frequency.slice(1) + ' at ' + Resolve.reminders.time
                : 'No reminders set'}
            </Text>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Milestones</Text>
          {milestones.length > 0 ? milestones.map((milestone: any, index: number) => (
            <View key={milestone.id} style={[styles.milestoneItem, { backgroundColor: colors.surface }]}>
              <TouchableOpacity 
                style={styles.milestoneCheckbox}
                onPress={() => handleToggleMilestone(milestone.id, milestone.completed)}
                disabled={togglingMilestone === milestone.id}
              >
                {togglingMilestone === milestone.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : milestone.completed ? (
                  <CheckCircle size={24} color="#96E6B3" />
                ) : (
                  <Circle size={24} color={colors.border} />
                )}
              </TouchableOpacity>
              <View style={styles.milestoneContent}>
                <Text style={[
                  styles.milestoneName,
                  { color: colors.text },
                  milestone.completed && [styles.milestoneNameCompleted, { color: colors.textSecondary }]
                ]}>
                  {milestone.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setMilestoneDeadlineDate(new Date(milestone.due_date));
                    setEditingMilestoneDeadline(milestone.id);
                  }}
                  disabled={saving}
                >
                  <View style={styles.milestoneDueContainer}>
                    <Calendar size={14} color={colors.primary} />
                    <Text style={[styles.milestoneDue, { color: colors.textSecondary }]}>
                      Due: {new Date(milestone.due_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                    <Edit size={12} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )) : (
            <View style={[styles.emptyMilestones, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyMilestonesText, { color: colors.textSecondary }]}>
                No milestones yet. Add your first milestone to get started!
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push(`/milestone-builder?resolveId=${Resolve.id}`)}
          >
            <Text style={styles.primaryButtonText}>{t('resolve.addMilestone')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleSharePakt}
          >
            <Share2 size={20} color="#9163F2" />
            <Text style={styles.secondaryButtonText}>{t('common.share')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuModal, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setShowMenu(false);
                router.push(`/edit-pakt?paktId=${Resolve.id}`);
              }}
            >
              <Edit size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('resolve.edit')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setShowMenu(false);
                handleSharePakt();
              }}
            >
              <Share2 size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('resolve.sharePakt')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={handleDeletePakt}
            >
              <Trash2 size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>{t('resolve.delete')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowMenu(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal */}
      {showDatePicker && DateTimePicker && (
        Platform.OS === 'ios' ? (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerModal}>
              <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={[styles.datePickerCancel, { color: colors.primary }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.datePickerTitle, { color: colors.text }]}>Select Deadline</Text>
                  <TouchableOpacity onPress={async () => {
                    await handleDateChange(null, selectedDate);
                  }}>
                    <Text style={[styles.datePickerDone, { color: colors.primary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setSelectedDate(date);
                  }}
                  minimumDate={new Date()}
                  textColor={colors.text}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )
      )}
      
      {/* Fallback Date Input Modal when DateTimePicker is not available */}
      {showDatePicker && !DateTimePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerModal}>
            <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.datePickerCancel, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.datePickerTitle, { color: colors.text }]}>Select Deadline</Text>
                <TouchableOpacity onPress={async () => {
                  const dateStr = selectedDate.toISOString().split('T')[0];
                  const newDate = new Date(dateStr);
                  await handleDateChange(null, newDate);
                }}>
                  <Text style={[styles.datePickerDone, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.fallbackDateInput}>
                <Text style={[styles.fallbackLabel, { color: colors.text }]}>Date (YYYY-MM-DD):</Text>
                <TextInput
                  style={[styles.fallbackInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={selectedDate.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    const date = new Date(text);
                    if (!isNaN(date.getTime())) {
                      setSelectedDate(date);
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Milestone Deadline Picker Modal */}
      {editingMilestoneDeadline && (
        Platform.OS === 'ios' && DateTimePicker ? (
          <Modal
            visible={!!editingMilestoneDeadline}
            transparent
            animationType="slide"
            onRequestClose={() => setEditingMilestoneDeadline(null)}
          >
            <View style={styles.datePickerModal}>
              <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setEditingMilestoneDeadline(null)}>
                    <Text style={[styles.datePickerCancel, { color: colors.primary }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('resolve.editMilestoneDeadline')}</Text>
                  <TouchableOpacity onPress={() => {
                    if (editingMilestoneDeadline) {
                      handleUpdateMilestoneDeadline(editingMilestoneDeadline, milestoneDeadlineDate);
                    }
                  }}>
                    <Text style={[styles.datePickerDone, { color: colors.primary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={milestoneDeadlineDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setMilestoneDeadlineDate(date);
                  }}
                  minimumDate={new Date()}
                  maximumDate={Resolve?.deadline ? new Date(Resolve.deadline) : undefined}
                  textColor={colors.text}
                />
              </View>
            </View>
          </Modal>
        ) : Platform.OS === 'android' && DateTimePicker ? (
          <DateTimePicker
            value={milestoneDeadlineDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setEditingMilestoneDeadline(null);
              if (date && editingMilestoneDeadline) {
                handleUpdateMilestoneDeadline(editingMilestoneDeadline, date);
              }
            }}
            minimumDate={new Date()}
            maximumDate={Resolve?.deadline ? new Date(Resolve.deadline) : undefined}
          />
        ) : (
          <Modal
            visible={!!editingMilestoneDeadline}
            transparent
            animationType="slide"
            onRequestClose={() => setEditingMilestoneDeadline(null)}
          >
            <View style={styles.datePickerModal}>
              <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setEditingMilestoneDeadline(null)}>
                    <Text style={[styles.datePickerCancel, { color: colors.primary }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.datePickerTitle, { color: colors.text }]}>{t('resolve.editMilestoneDeadline')}</Text>
                  <TouchableOpacity onPress={() => {
                    if (editingMilestoneDeadline) {
                      handleUpdateMilestoneDeadline(editingMilestoneDeadline, milestoneDeadlineDate);
                    }
                  }}>
                    <Text style={[styles.datePickerDone, { color: colors.primary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.fallbackDateInput}>
                  <Text style={[styles.fallbackLabel, { color: colors.text }]}>Date (YYYY-MM-DD):</Text>
                  <TextInput
                    style={[styles.fallbackInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    value={milestoneDeadlineDate.toISOString().split('T')[0]}
                    onChangeText={(text) => {
                      const date = new Date(text);
                      if (!isNaN(date.getTime())) {
                        setMilestoneDeadlineDate(date);
                      }
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {Resolve?.deadline && (
                    <Text style={[styles.fallbackHint, { color: colors.textSecondary }]}>
                      Must be before {new Date(Resolve.deadline).toISOString().split('T')[0]}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Modal>
        )
      )}

      <DeleteConfirmationModal
        visible={showDeleteConfirm}
        title={t('resolve.deleteResolve')}
        message={t('resolve.deleteConfirmMessage', { resolveName: Resolve?.name || '' })}
        cancelText={t('common.cancel')}
        deleteText={t('resolve.delete')}
        onCancel={() => setShowDeleteConfirm(false)}
        onDelete={confirmDeletePakt}
      />

      <SuccessModal
        visible={showCompletionModal}
        title={t('resolve.completionTitle')}
        message={t('resolve.completionMessage')}
        buttonText={t('common.done')}
        onButtonPress={() => setShowCompletionModal(false)}
      />

      <ErrorModal
        visible={showNotFoundModal}
        title={t('resolve.notFoundTitle')}
        message={t('resolve.notFoundMessage')}
        buttonText={t('common.done')}
        onButtonPress={() => {
          setShowNotFoundModal(false);
          router.back();
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#9163F2',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paktName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    flex: 1,
    marginRight: 12,
  },
  paktCategory: {
    fontSize: 14,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  milestoneProgress: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  milestoneCheckbox: {
    marginRight: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneDueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  milestoneName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  milestoneNameCompleted: {
    textDecorationLine: 'line-through',
  },
  milestoneDue: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#9163F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#9163F2',
  },
  secondaryButtonText: {
    color: '#9163F2',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemTextDanger: {
    // Color is now set dynamically in component
  },
  cancelButton: {
    marginTop: 8,
    padding: 18,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyMilestones: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyMilestonesText: {
    fontSize: 14,
    textAlign: 'center',
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
    fontStyle: 'italic',
  },
});

