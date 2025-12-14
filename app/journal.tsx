import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, BookOpen, Calendar, Edit, Trash2, X, Share2 } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { JournalService, type JournalEntry } from '../src/services/journal.service';
import { useResolves } from '../src/hooks/useResolves';
import { translateResolveName } from '../src/utils/translations';
import BottomTabBar from '../src/components/BottomTabBar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function JournalScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { resolves: Resolves } = useResolves();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedPaktId, setSelectedPaktId] = useState<string>('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await JournalService.getUserEntries(user.id);
      setEntries(data);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      Alert.alert('Error', 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!user || !thoughts.trim()) {
      Alert.alert('Error', 'Please write your thoughts');
      return;
    }

    try {
      setSaving(true);
      
      if (editingEntry) {
        await JournalService.updateEntry(editingEntry.id, {
          user_id: user.id,
          pakt_id: selectedPaktId || undefined,
          date: entryDate,
          title: title.trim() || undefined,
          mood: mood || undefined,
          thoughts: thoughts.trim(),
        });
      } else {
        await JournalService.createEntry({
          user_id: user.id,
          pakt_id: selectedPaktId || undefined,
          date: entryDate,
          title: title.trim() || undefined,
          mood: mood || undefined,
          thoughts: thoughts.trim(),
        });
      }

      setShowEntryModal(false);
      resetForm();
      await loadEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entry: JournalEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await JournalService.deleteEntry(entry.id);
              await loadEntries();
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setSelectedPaktId(entry.pakt_id || '');
    setEntryDate(entry.date);
    setTitle(entry.title || '');
    setMood(entry.mood || '');
    setThoughts(entry.thoughts);
    setShowEntryModal(true);
  };

  const resetForm = () => {
    setEditingEntry(null);
    setSelectedPaktId('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setTitle('');
    setMood('');
    setThoughts('');
  };

  const openNewEntry = () => {
    resetForm();
    setShowEntryModal(true);
  };

  const getPaktName = (paktId?: string) => {
    if (!paktId || !Resolves) return null;
    const Resolve = Resolves.find(p => p.id === paktId);
    return Resolve?.name;
  };

  const generateJournalPDFHTML = (entry: JournalEntry): string => {
    const entryDate = new Date(entry.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const paktName = entry.pakt_id ? getPaktName(entry.pakt_id) : null;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 40px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              border-bottom: 3px solid #6366f1;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .date {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 15px;
            }
            .meta {
              display: flex;
              gap: 20px;
              flex-wrap: wrap;
              margin-bottom: 20px;
            }
            .meta-item {
              font-size: 14px;
              color: #4b5563;
            }
            .mood {
              font-size: 32px;
              margin: 20px 0;
            }
            .content {
              margin-top: 30px;
            }
            .thoughts {
              font-size: 16px;
              line-height: 1.8;
              color: #374151;
              white-space: pre-wrap;
            }
            .tag {
              display: inline-block;
              background-color: #eef2ff;
              color: #6366f1;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${entry.title || 'Journal Entry'}</div>
            <div class="date">${entryDate}</div>
            <div class="meta">
              ${paktName ? `<div class="meta-item"><strong>Linked to:</strong> ${paktName}</div>` : ''}
              ${entry.mood ? `<div class="meta-item"><strong>Mood:</strong> ${entry.mood}</div>` : ''}
            </div>
          </div>
          ${entry.mood ? `<div class="mood">${entry.mood}</div>` : ''}
          <div class="content">
            <div class="thoughts">${entry.thoughts}</div>
          </div>
        </body>
      </html>
    `;
  };

  const handleShareJournal = async (entry: JournalEntry) => {
    try {
      const html = generateJournalPDFHTML(entry);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Journal Entry${entry.title ? `: ${entry.title}` : ''}`,
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing journal:', error);
      Alert.alert('Error', 'Failed to share journal entry');
    }
  };

  const moods = ['😊', '😌', '😐', '😟', '😢', '🎉', '💪', '🙏'];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('journal.title')}</Text>
        <TouchableOpacity onPress={openNewEntry}>
          <Plus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('journal.noEntries')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('journal.writeFirst')}</Text>
            <TouchableOpacity
              style={[styles.newEntryButton, { backgroundColor: colors.primary }]}
              onPress={openNewEntry}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.newEntryButtonText}>{t('journal.newEntry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {entries.map((entry) => (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.surface }]}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryDateContainer}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
                      {new Date(entry.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.entryActions}>
                    <TouchableOpacity
                      onPress={() => handleShareJournal(entry)}
                      style={styles.actionButton}
                    >
                      <Share2 size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleEditEntry(entry)}
                      style={styles.actionButton}
                    >
                      <Edit size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteEntry(entry)}
                      style={styles.actionButton}
                    >
                      <Trash2 size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {entry.title && (
                  <Text style={[styles.entryTitle, { color: colors.text }]}>{entry.title}</Text>
                )}

                {entry.pakt_id && (
                  <View style={[styles.paktTag, { backgroundColor: `${colors.primary}20` }]}>
                    <Text style={[styles.paktTagText, { color: colors.primary }]}>
                      {t('journal.linkedToResolve')}: {getPaktName(entry.pakt_id)}
                    </Text>
                  </View>
                )}

                {entry.mood && (
                  <Text style={styles.moodEmoji}>{entry.mood}</Text>
                )}

                <Text style={[styles.entryThoughts, { color: colors.text }]}>{entry.thoughts}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* New/Edit Entry Modal */}
      <Modal
        visible={showEntryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEntryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingEntry ? t('common.edit') : t('journal.newEntry')}
              </Text>
              <TouchableOpacity onPress={() => setShowEntryModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Title (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter journal title"
                />
              </View>

              {/* Date */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('journal.date')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                  value={entryDate}
                  onChangeText={setEntryDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              {/* Linked Resolve */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('journal.linkedToResolve')} (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paktSelector}>
                  <TouchableOpacity
                    style={[
                      styles.paktChip,
                      { backgroundColor: selectedPaktId === '' ? colors.primary : colors.background },
                    ]}
                    onPress={() => setSelectedPaktId('')}
                  >
                    <Text
                      style={[
                        styles.paktChipText,
                        { color: selectedPaktId === '' ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {Resolves && Resolves.map((Resolve) => (
                    <TouchableOpacity
                      key={Resolve.id}
                      style={[
                        styles.paktChip,
                        {
                          backgroundColor: selectedPaktId === Resolve.id ? colors.primary : colors.background,
                        },
                      ]}
                      onPress={() => setSelectedPaktId(Resolve.id)}
                    >
                      <Text
                        style={[
                          styles.paktChipText,
                          { color: selectedPaktId === Resolve.id ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {translateResolveName(Resolve.name)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Mood */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('journal.mood')} (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodSelector}>
                  <TouchableOpacity
                    style={[
                      styles.moodOption,
                      { backgroundColor: !mood || mood === '' ? colors.primary : colors.background },
                    ]}
                    onPress={() => setMood('')}
                  >
                    <Text style={styles.moodOptionText}>✖️</Text>
                  </TouchableOpacity>
                  {moods.map((moodEmoji) => (
                    <TouchableOpacity
                      key={moodEmoji}
                      style={[
                        styles.moodOption,
                        { backgroundColor: mood === moodEmoji ? colors.primary : colors.background },
                      ]}
                      onPress={() => setMood(moodEmoji)}
                    >
                      <Text style={styles.moodOptionText}>{moodEmoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Thoughts */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('journal.thoughts')}</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    { backgroundColor: colors.background, color: colors.text },
                  ]}
                  value={thoughts}
                  onChangeText={setThoughts}
                  placeholder={t('journal.writeReflection')}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveEntry}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>{t('journal.saveEntry')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomTabBar />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  newEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  newEntryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  entriesList: {
    padding: 24,
    gap: 16,
  },
  entryCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  paktTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  paktTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  entryThoughts: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 150,
  },
  paktSelector: {
    marginTop: 8,
  },
  paktChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  paktChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  moodSelector: {
    marginTop: 8,
  },
  moodOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  moodOptionText: {
    fontSize: 24,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
