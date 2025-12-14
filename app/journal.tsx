import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, BookOpen, Calendar, Edit, Trash2, X, Share2, Camera, Image as ImageIcon, FileText, Video, XCircle } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { JournalService, type JournalEntry, type JournalMedia } from '../src/services/journal.service';
import { useResolves } from '../src/hooks/useResolves';
import { translateResolveName } from '../src/utils/translations';
import BottomTabBar from '../src/components/BottomTabBar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { StorageService } from '../src/services/storage.service';

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
  const [media, setMedia] = useState<JournalMedia[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState<Record<number, number>>({});

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

  const uploadMediaFiles = async (entryId: string) => {
    if (!user || media.length === 0) return;

    try {
      setUploadingMedia(true);
      const uploadedMedia: JournalMedia[] = [];
      const mediaToUpload = media.filter(item => item.url && item.url.startsWith('file://'));
      
      // Initialize progress for all files to upload
      const progressMap: Record<number, number> = {};
      mediaToUpload.forEach((_, index) => {
        const originalIndex = media.findIndex(m => m === mediaToUpload[index]);
        progressMap[originalIndex] = 0;
      });
      setMediaUploadProgress(progressMap);

      for (let i = 0; i < media.length; i++) {
        const mediaItem = media[i];
        
        // If media already has a URL (from editing), skip upload
        if (mediaItem.url && mediaItem.url.startsWith('http')) {
          uploadedMedia.push(mediaItem);
          continue;
        }

        // Upload new media
        if (mediaItem.url && mediaItem.url.startsWith('file://')) {
          const mimeType = mediaItem.type === 'image' ? 'image/jpeg' :
                          mediaItem.type === 'video' ? 'video/mp4' :
                          'application/octet-stream';
          
          // Simulate progress updates during upload (smooth progress)
          let currentProgress = 0;
          const progressInterval = setInterval(() => {
            currentProgress = Math.min(currentProgress + Math.random() * 15 + 5, 85); // Increment randomly up to 85%
            setMediaUploadProgress(prev => ({
              ...prev,
              [i]: Math.floor(currentProgress),
            }));
          }, 300);

          try {
            const uploadedUrl = await StorageService.uploadJournalMedia(
              user.id,
              entryId,
              mediaItem.url,
              mediaItem.name,
              mimeType
            );

            clearInterval(progressInterval);
            setMediaUploadProgress(prev => ({ ...prev, [i]: 100 }));

            uploadedMedia.push({
              ...mediaItem,
              url: uploadedUrl,
            });
          } catch (error) {
            clearInterval(progressInterval);
            setMediaUploadProgress(prev => ({ ...prev, [i]: 0 }));
            throw error;
          }
        }
      }

      // Update entry with uploaded media URLs
      if (uploadedMedia.length > 0) {
        await JournalService.updateEntry(entryId, { media: uploadedMedia });
        setMedia(uploadedMedia);
      }

      // Clear progress after a short delay
      setTimeout(() => {
        setMediaUploadProgress({});
      }, 500);
    } catch (error) {
      console.error('Error uploading media:', error);
      Alert.alert('Error', 'Failed to upload some media files');
      setMediaUploadProgress({});
    } finally {
      setUploadingMedia(false);
    }
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    if (!user) return;

    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant camera permissions to take a photo');
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images', 'videos'],
          allowsEditing: true,
          quality: 0.8,
          videoMaxDuration: 60, // 60 seconds max
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant media library permissions');
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          allowsEditing: true,
          quality: 0.8,
          videoMaxDuration: 60,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaType = asset.type === 'video' ? 'video' : 'image';
        const fileName = asset.fileName || `${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;

        setMedia([...media, {
          type: mediaType,
          url: asset.uri,
          name: fileName,
          thumbnail: asset.type === 'video' ? asset.uri : undefined,
        }]);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
    setShowMediaPicker(false);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMedia([...media, {
          type: 'document',
          url: asset.uri,
          name: asset.name,
        }]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
    setShowMediaPicker(false);
  };

  const handleRemoveMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    setMedia(newMedia);
  };

  const handleSaveEntry = async () => {
    if (!user || !thoughts.trim()) {
      Alert.alert('Error', 'Please write your thoughts');
      return;
    }

    try {
      setSaving(true);
      
      let entryId: string;
      
      if (editingEntry) {
        await JournalService.updateEntry(editingEntry.id, {
          user_id: user.id,
          pakt_id: selectedPaktId || undefined,
          date: entryDate,
          title: title.trim() || undefined,
          mood: mood || undefined,
          thoughts: thoughts.trim(),
        });
        entryId = editingEntry.id;
      } else {
        const newEntry = await JournalService.createEntry({
          user_id: user.id,
          pakt_id: selectedPaktId || undefined,
          date: entryDate,
          title: title.trim() || undefined,
          mood: mood || undefined,
          thoughts: thoughts.trim(),
        });
        entryId = newEntry.id;
      }
      
      // Upload media files after entry is created/updated
      if (media.length > 0) {
        // Keep saving state true while uploading media
        await uploadMediaFiles(entryId);
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
    setMedia(entry.media || []);
    setShowEntryModal(true);
  };

  const resetForm = () => {
    setEditingEntry(null);
    setSelectedPaktId('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setTitle('');
    setMood('');
    setThoughts('');
    setMedia([]);
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

  // Helper function to convert image URL to base64 data URI
  const convertImageToBase64 = async (url: string): Promise<string | null> => {
    try {
      if (url.startsWith('data:')) {
        return url; // Already a data URI
      }

      if (Platform.OS === 'web') {
        // For web, fetch and convert to base64
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // For native, use FileSystem
        if (url.startsWith('file://')) {
          // Try legacy API first (for consistency with storage service)
          try {
            const base64 = await FileSystemLegacy.readAsStringAsync(url, {
              encoding: FileSystemLegacy.EncodingType.Base64,
            });
            // Determine MIME type from file extension
            const ext = url.split('.').pop()?.toLowerCase();
            const mimeTypes: Record<string, string> = {
              jpg: 'image/jpeg',
              jpeg: 'image/jpeg',
              png: 'image/png',
              gif: 'image/gif',
              webp: 'image/webp',
            };
            const mimeType = mimeTypes[ext || ''] || 'image/jpeg';
            return `data:${mimeType};base64,${base64}`;
          } catch (legacyError) {
            // Fallback to new API if legacy fails
            try {
              // Try with EncodingType if available, otherwise use string
              const encoding = (FileSystem.EncodingType as any)?.Base64 || 'base64';
              const base64 = await FileSystem.readAsStringAsync(url, {
                encoding: encoding as any,
              });
              const ext = url.split('.').pop()?.toLowerCase();
              const mimeTypes: Record<string, string> = {
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                gif: 'image/gif',
                webp: 'image/webp',
              };
              const mimeType = mimeTypes[ext || ''] || 'image/jpeg';
              return `data:${mimeType};base64,${base64}`;
            } catch (error) {
              console.error('Error reading file:', error);
              return null;
            }
          }
        } else {
          // For remote URLs, download first
          const downloadResult = await FileSystem.downloadAsync(
            url,
            FileSystem.documentDirectory + `temp_${Date.now()}.jpg`
          );
          if (downloadResult.uri) {
            try {
              const base64 = await FileSystemLegacy.readAsStringAsync(downloadResult.uri, {
                encoding: FileSystemLegacy.EncodingType.Base64,
              });
              // Clean up temp file
              await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
              return `data:image/jpeg;base64,${base64}`;
            } catch (legacyError) {
              try {
                const encoding = (FileSystem.EncodingType as any)?.Base64 || 'base64';
                const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
                  encoding: encoding as any,
                });
                await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
                return `data:image/jpeg;base64,${base64}`;
              } catch (error) {
                // Clean up temp file even on error
                await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true }).catch(() => {});
                return null;
              }
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  const generateJournalPDFHTML = async (entry: JournalEntry): Promise<string> => {
    const entryDate = new Date(entry.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const paktName = entry.pakt_id ? getPaktName(entry.pakt_id) : null;

    // Process media for PDF
    let mediaHTML = '';
    if (entry.media && entry.media.length > 0) {
      const mediaItems = await Promise.all(
        entry.media.map(async (mediaItem) => {
          if (mediaItem.type === 'image') {
            const base64Data = await convertImageToBase64(mediaItem.url);
            if (base64Data) {
              return `
                <div class="media-item">
                  <div class="media-label">Image: ${mediaItem.name}</div>
                  <img src="${base64Data}" alt="${mediaItem.name}" class="media-image" />
                </div>
              `;
            } else {
              return `
                <div class="media-item">
                  <div class="media-label">Image: ${mediaItem.name}</div>
                  <div class="media-placeholder">Image could not be loaded</div>
                </div>
              `;
            }
          } else if (mediaItem.type === 'video') {
            return `
              <div class="media-item">
                <div class="media-label">Video: ${mediaItem.name}</div>
                <div class="media-placeholder">
                  <div class="media-icon">🎥</div>
                  <div>Video attachment: ${mediaItem.name}</div>
                  ${mediaItem.url ? `<div class="media-link">URL: ${mediaItem.url}</div>` : ''}
                </div>
              </div>
            `;
          } else if (mediaItem.type === 'document') {
            return `
              <div class="media-item">
                <div class="media-label">Document: ${mediaItem.name}</div>
                <div class="media-placeholder">
                  <div class="media-icon">📄</div>
                  <div>Document attachment: ${mediaItem.name}</div>
                  ${mediaItem.url ? `<div class="media-link">URL: ${mediaItem.url}</div>` : ''}
                </div>
              </div>
            `;
          }
          return '';
        })
      );
      mediaHTML = `
        <div class="media-section">
          <h3 class="media-section-title">Attachments</h3>
          <div class="media-container">
            ${mediaItems.join('')}
          </div>
        </div>
      `;
    }

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
              margin-bottom: 30px;
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
            .media-section {
              margin-top: 40px;
              page-break-inside: avoid;
            }
            .media-section-title {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 20px;
              border-top: 2px solid #e5e7eb;
              padding-top: 20px;
            }
            .media-container {
              display: flex;
              flex-direction: column;
              gap: 20px;
            }
            .media-item {
              page-break-inside: avoid;
              margin-bottom: 20px;
            }
            .media-label {
              font-size: 14px;
              font-weight: 600;
              color: #4b5563;
              margin-bottom: 10px;
            }
            .media-image {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              page-break-inside: avoid;
            }
            .media-placeholder {
              background-color: #f3f4f6;
              border: 2px dashed #d1d5db;
              border-radius: 8px;
              padding: 30px;
              text-align: center;
              color: #6b7280;
              page-break-inside: avoid;
            }
            .media-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .media-link {
              font-size: 12px;
              color: #6366f1;
              margin-top: 10px;
              word-break: break-all;
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
            ${mediaHTML}
          </div>
        </body>
      </html>
    `;
  };

  const handleShareJournal = async (entry: JournalEntry) => {
    try {
      const html = await generateJournalPDFHTML(entry);
      
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
      Alert.alert('Error', 'Failed to share journal entry. Some media may not be included if it could not be loaded.');
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

                {entry.media && entry.media.length > 0 && (
                  <View style={styles.mediaContainer}>
                    {entry.media.map((mediaItem, index) => (
                      <View key={index} style={styles.mediaItem}>
                        {mediaItem.type === 'image' && (
                          <Image source={{ uri: mediaItem.url }} style={styles.mediaImage} />
                        )}
                        {mediaItem.type === 'video' && (
                          <View style={styles.mediaVideoContainer}>
                            <Video size={24} color={colors.primary} />
                            <Text style={[styles.mediaName, { color: colors.text }]} numberOfLines={2}>
                              {mediaItem.name}
                            </Text>
                          </View>
                        )}
                        {mediaItem.type === 'document' && (
                          <View style={styles.mediaDocumentContainer}>
                            <FileText size={24} color={colors.primary} />
                            <Text style={[styles.mediaName, { color: colors.text }]}>{mediaItem.name}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
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

              {/* Media */}
              <View style={styles.formGroup}>
                <View style={styles.mediaHeader}>
                  <Text style={[styles.label, { color: colors.text }]}>Media (Optional)</Text>
                  <TouchableOpacity
                    onPress={() => setShowMediaPicker(true)}
                    style={[styles.addMediaButton, { backgroundColor: colors.primary }]}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.addMediaButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {media.length > 0 && (
                  <View style={styles.mediaPreviewContainer}>
                    {media.map((mediaItem, index) => {
                      const uploadProgress = mediaUploadProgress[index];
                      const isUploading = uploadProgress !== undefined && uploadProgress < 100 && uploadProgress > 0;
                      const isLocalFile = mediaItem.url && mediaItem.url.startsWith('file://');
                      const isUploaded = mediaItem.url && mediaItem.url.startsWith('http');
                      
                      return (
                        <View key={index} style={styles.mediaPreviewItem}>
                          <View style={styles.mediaPreviewContent}>
                            {mediaItem.type === 'image' && (
                              <Image 
                                source={{ uri: mediaItem.url }} 
                                style={[
                                  styles.mediaPreviewImage,
                                  isUploading && styles.mediaPreviewImageUploading
                                ]} 
                              />
                            )}
                            {(mediaItem.type === 'video' || mediaItem.type === 'document') && (
                              <View style={[
                                styles.mediaPreviewIcon, 
                                { backgroundColor: colors.background },
                                isUploading && styles.mediaPreviewIconUploading
                              ]}>
                                {mediaItem.type === 'video' ? (
                                  <Video size={20} color={colors.primary} />
                                ) : (
                                  <FileText size={20} color={colors.primary} />
                                )}
                              </View>
                            )}
                            
                            {/* Upload Progress Overlay */}
                            {isUploading && (
                              <View style={styles.uploadProgressOverlay}>
                                <View style={styles.uploadProgressContainer}>
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                  <Text style={styles.uploadProgressText}>
                                    {uploadProgress}%
                                  </Text>
                                </View>
                                <View style={styles.uploadProgressBarContainer}>
                                  <View style={[styles.uploadProgressBar, { width: `${uploadProgress}%` }]} />
                                </View>
                              </View>
                            )}
                            
                            {/* Upload Complete Indicator */}
                            {!isUploading && isLocalFile && uploadProgress === 100 && (
                              <View style={styles.uploadCompleteOverlay}>
                                <View style={styles.uploadCompleteBadge}>
                                  <Text style={styles.uploadCompleteText}>✓</Text>
                                </View>
                              </View>
                            )}
                            
                            {/* Already Uploaded Indicator */}
                            {isUploaded && !isUploading && (
                              <View style={styles.uploadCompleteOverlay}>
                                <View style={[styles.uploadCompleteBadge, { backgroundColor: '#2196F3' }]}>
                                  <Text style={styles.uploadCompleteText}>✓</Text>
                                </View>
                              </View>
                            )}
                          </View>
                          
                          <Text style={[styles.mediaPreviewName, { color: colors.text }]} numberOfLines={1}>
                            {mediaItem.name}
                          </Text>
                          
                          {!isUploading && (
                            <TouchableOpacity
                              onPress={() => handleRemoveMedia(index)}
                              style={styles.removeMediaButton}
                            >
                              <XCircle size={18} color="#FF6B6B" />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
                
                {uploadingMedia && (
                  <View style={styles.uploadingIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.uploadingText, { color: colors.textSecondary }]}>
                      Uploading media...
                    </Text>
                  </View>
                )}
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

      {/* Media Picker Modal */}
      <Modal
        visible={showMediaPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMediaPicker(false)}
      >
        <View style={styles.mediaPickerOverlay}>
          <View style={[styles.mediaPickerContent, { backgroundColor: colors.surface }]}>
            <View style={styles.mediaPickerHeader}>
              <Text style={[styles.mediaPickerTitle, { color: colors.text }]}>Add Media</Text>
              <TouchableOpacity onPress={() => setShowMediaPicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.mediaPickerOptions}>
              <TouchableOpacity
                style={[styles.mediaPickerOption, { backgroundColor: colors.background }]}
                onPress={() => handlePickImage('camera')}
              >
                <Camera size={32} color={colors.primary} />
                <Text style={[styles.mediaPickerOptionText, { color: colors.text }]}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mediaPickerOption, { backgroundColor: colors.background }]}
                onPress={() => handlePickImage('gallery')}
              >
                <ImageIcon size={32} color={colors.primary} />
                <Text style={[styles.mediaPickerOptionText, { color: colors.text }]}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mediaPickerOption, { backgroundColor: colors.background }]}
                onPress={handlePickDocument}
              >
                <FileText size={32} color={colors.primary} />
                <Text style={[styles.mediaPickerOptionText, { color: colors.text }]}>Choose Document</Text>
              </TouchableOpacity>
            </View>
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
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  mediaItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  mediaVideoContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mediaDocumentContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mediaName: {
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addMediaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  mediaPreviewItem: {
    width: 80,
    alignItems: 'center',
    position: 'relative',
  },
  mediaPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  mediaPreviewImageUploading: {
    opacity: 0.7,
  },
  mediaPreviewIcon: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPreviewIconUploading: {
    opacity: 0.7,
  },
  mediaPreviewName: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  removeMediaButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  mediaPreviewContent: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  uploadProgressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  uploadProgressContainer: {
    alignItems: 'center',
    gap: 4,
  },
  uploadProgressText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadProgressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  uploadProgressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease',
  },
  uploadCompleteOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 1,
  },
  uploadCompleteBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadCompleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  uploadingText: {
    fontSize: 14,
  },
  mediaPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  mediaPickerContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  mediaPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  mediaPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  mediaPickerOptions: {
    gap: 16,
  },
  mediaPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  mediaPickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
