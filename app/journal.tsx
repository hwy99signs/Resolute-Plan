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
import { DeleteConfirmationModal } from '../src/components/DeleteConfirmationModal';

// Debug logging helper
const debugLog = async (location: string, message: string, data: any, hypothesisId: string) => {
  const logEntry = {
    location,
    message,
    data,
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId
  };
  const logLine = JSON.stringify(logEntry) + '\n';
  console.log(`[DEBUG] ${location}: ${message}`, data);
  try {
    // Write to app document directory - we'll read from console for now
    const logPath = FileSystem.documentDirectory + 'pdf_debug.log';
    const existingContent = await FileSystem.readAsStringAsync(logPath).catch(() => '');
    await FileSystem.writeAsStringAsync(logPath, existingContent + logLine, { encoding: FileSystem.EncodingType.UTF8 });
  } catch (e) {
    // Console logging is primary - file is secondary
  }
};

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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [sharing, setSharing] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

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
          // Determine MIME type based on file extension and type
          let mimeType = 'application/octet-stream';
          
          if (mediaItem.type === 'image') {
            // Determine image MIME type from extension
            const ext = mediaItem.name.split('.').pop()?.toLowerCase();
            const imageMimeTypes: Record<string, string> = {
              jpg: 'image/jpeg',
              jpeg: 'image/jpeg',
              png: 'image/png',
              gif: 'image/gif',
              webp: 'image/webp',
              bmp: 'image/bmp',
            };
            mimeType = imageMimeTypes[ext || ''] || 'image/jpeg';
          } else if (mediaItem.type === 'video') {
            // Determine video MIME type from extension
            const ext = mediaItem.name.split('.').pop()?.toLowerCase();
            const videoMimeTypes: Record<string, string> = {
              mp4: 'video/mp4',
              mov: 'video/quicktime',
              avi: 'video/x-msvideo',
              mkv: 'video/x-matroska',
              webm: 'video/webm',
              m4v: 'video/x-m4v',
            };
            mimeType = videoMimeTypes[ext || ''] || 'video/mp4';
          } else if (mediaItem.type === 'document') {
            // Determine document MIME type from extension
            const ext = mediaItem.name.split('.').pop()?.toLowerCase();
            const documentMimeTypes: Record<string, string> = {
              pdf: 'application/pdf',
              doc: 'application/msword',
              docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              txt: 'text/plain',
              rtf: 'application/rtf',
              odt: 'application/vnd.oasis.opendocument.text',
              // Image documents
              jpg: 'image/jpeg',
              jpeg: 'image/jpeg',
              png: 'image/png',
              gif: 'image/gif',
              webp: 'image/webp',
              bmp: 'image/bmp',
            };
            mimeType = documentMimeTypes[ext || ''] || 'application/pdf';
          }
          
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

            // Note: Video thumbnail generation during upload is complex and may fail
            // Thumbnails will be extracted during PDF generation if needed
            // For now, keep existing thumbnail if available

            uploadedMedia.push({
              ...mediaItem,
              url: uploadedUrl,
              thumbnail: mediaItem.thumbnail, // Keep existing thumbnail if available
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

  const handleDeleteEntry = (entry: JournalEntry) => {
    setEntryToDelete(entry);
    setDeleteModalVisible(true);
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return;
    
            try {
      await JournalService.deleteEntry(entryToDelete.id);
              await loadEntries();
      setDeleteModalVisible(false);
      setEntryToDelete(null);
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
      setDeleteModalVisible(false);
      setEntryToDelete(null);
            }
  };

  const cancelDeleteEntry = () => {
    setDeleteModalVisible(false);
    setEntryToDelete(null);
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

  // Helper function to extract a video frame as base64
  const extractVideoFrame = async (videoUrl: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        // For web, use HTML5 video element to extract frame
        return new Promise((resolve) => {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.preload = 'metadata';
          video.muted = true; // Mute to allow autoplay
          video.playsInline = true;
          video.src = videoUrl;
          
          let resolved = false;
          
          const cleanup = () => {
            if (!resolved) {
              resolved = true;
              video.remove();
            }
          };
          
          const extractFrame = () => {
            try {
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                  cleanup();
                  resolve(dataUrl);
                  return;
                }
              }
            } catch (error) {
              console.error('Error extracting video frame:', error);
            }
            cleanup();
            resolve(null);
          };
          
          video.onloadedmetadata = () => {
            try {
              video.currentTime = 0.1; // Seek to 0.1 seconds to get a frame
            } catch (error) {
              console.error('Error seeking video:', error);
              cleanup();
              resolve(null);
            }
          };
          
          video.onseeked = extractFrame;
          video.onloadeddata = extractFrame;
          
          video.onerror = (error) => {
            console.error('Video load error:', error);
            cleanup();
            resolve(null);
          };
          
          // Timeout after 10 seconds
          setTimeout(() => {
            if (!resolved) {
              cleanup();
              resolve(null);
            }
          }, 10000);
          
          // Try to load the video
          video.load();
        });
      } else {
        // For native, we can't easily extract frames without expo-av
        // Return null and rely on stored thumbnails or placeholders
        return null;
      }
    } catch (error) {
      console.error('Error extracting video frame:', error);
      return null;
    }
  };

  // Helper function to convert any media URL to base64 data URI
  const convertMediaToBase64 = async (url: string, mimeType?: string): Promise<string | null> => {
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

  // Helper to escape HTML
  const escapeHTML = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const generateJournalPDFHTML = async (entry: JournalEntry): Promise<string> => {
    try {
      // Always generate base content first
      const entryDate = new Date(entry.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const paktName = entry.pakt_id ? getPaktName(entry.pakt_id) : null;

      // Process media for PDF with error handling and timeout
      let mediaHTML = '';
      
      // TEMPORARY FIX: Always show placeholders instead of embedding media
      // This prevents large base64 data from breaking PDF generation
      const EMBED_MEDIA_IN_PDF = false; // Set to true to try embedding (may cause blank PDFs)
      
      // Simplified media handling - just show placeholders to avoid PDF generation issues
      if (entry.media && entry.media.length > 0) {
        try {
          console.log('Adding media placeholders for PDF:', entry.media.length, 'items');
          
          const mediaItems = entry.media.map((mediaItem) => {
            const escapedName = escapeHTML(mediaItem.name || 'Unknown');
            let icon = '📎';
            let typeLabel = 'Attachment';
            
            if (mediaItem.type === 'image') {
              icon = '🖼️';
              typeLabel = 'Image';
            } else if (mediaItem.type === 'video') {
              icon = '🎥';
              typeLabel = 'Video';
            } else if (mediaItem.type === 'document') {
              icon = '📄';
              typeLabel = 'Document';
            }
            
            return `
              <div class="media-item" style="margin-bottom: 12px; padding: 12px; background-color: #f3f4f6; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">${icon}</span>
                  <div>
                    <div style="font-weight: 600; color: #374151;">${typeLabel}: ${escapedName}</div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Media attachment included in journal entry</div>
                  </div>
                </div>
              </div>
            `;
          });
          
          if (mediaItems.length > 0) {
            mediaHTML = `
              <div class="media-section" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <h3 style="font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 16px;">Attachments (${entry.media.length})</h3>
                ${mediaItems.join('')}
              </div>
            `;
          }
        } catch (mediaError) {
          console.error('Error processing media:', mediaError);
          // Continue without media if processing fails
          mediaHTML = '';
        }
      }

      // Generate the HTML - always include journal content even if media fails
      const html = `
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
            .video-preview {
              position: relative;
              display: inline-block;
              width: 100%;
            }
            .video-overlay {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background-color: rgba(0, 0, 0, 0.7);
              border-radius: 50%;
              width: 80px;
              height: 80px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              pointer-events: none;
            }
            .video-play-icon {
              font-size: 32px;
              color: #ffffff;
              margin-bottom: 4px;
            }
            .video-label {
              font-size: 12px;
              color: #ffffff;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${escapeHTML(entry.title || 'Journal Entry')}</div>
            <div class="date">${entryDate}</div>
            <div class="meta">
              ${paktName ? `<div class="meta-item"><strong>Linked to:</strong> ${escapeHTML(paktName)}</div>` : ''}
              ${entry.mood ? `<div class="meta-item"><strong>Mood:</strong> ${escapeHTML(entry.mood)}</div>` : ''}
            </div>
          </div>
          ${entry.mood ? `<div class="mood">${escapeHTML(entry.mood)}</div>` : ''}
          <div class="content">
            <div class="thoughts">${escapeHTML(entry.thoughts || 'No thoughts recorded.')}</div>
            ${mediaHTML || ''}
          </div>
        </body>
      </html>
    `;
      
      // Validate HTML structure before returning
      console.log('PDF HTML generated, length:', html.length, 'has media:', !!mediaHTML);
      
      if (!html || html.trim().length < 100) {
        console.error('HTML validation failed - too short:', html?.length);
        throw new Error('Generated HTML is too short or empty');
      }
      
      // Check for basic HTML structure
      if (!html.includes('<html>') || !html.includes('</html>') || !html.includes('<body>') || !html.includes('</body>')) {
        console.error('HTML validation failed - invalid structure');
        throw new Error('Generated HTML has invalid structure');
      }
      
      console.log('PDF HTML generated successfully, length:', html.length);
      return html;
    } catch (error) {
      console.error('Error generating PDF HTML:', error);
      // Return a minimal valid HTML even if there's an error
      const entryDate = new Date(entry.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 40px;
                color: #333;
              }
              .title {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .date {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 15px;
              }
              .thoughts {
                font-size: 16px;
                line-height: 1.8;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            <div class="title">${escapeHTML(entry.title || 'Journal Entry')}</div>
            <div class="date">${entryDate}</div>
            <div class="thoughts">${escapeHTML(entry.thoughts || 'No thoughts recorded.')}</div>
          </body>
        </html>
      `;
    }
  };

  const handleShareJournal = async (entry: JournalEntry) => {
    // Prevent multiple simultaneous share requests
    if (sharing) {
      return;
    }

    try {
      setSharing(true);
      console.log('Starting PDF generation for entry:', entry.id);
      
      let html = await generateJournalPDFHTML(entry);
      
      console.log('HTML generated, length:', html?.length);
      
      // Validate HTML is not empty
      if (!html || html.trim().length === 0) {
        throw new Error('Generated HTML is empty');
      }
      
      console.log('Generating PDF from HTML, length:', html.length);
      
      // Limit HTML size to prevent PDF generation failures
      const MAX_HTML_LENGTH = 5000000; // 5MB max
      if (html.length > MAX_HTML_LENGTH) {
        console.warn('HTML too large, truncating content');
        // Keep only essential parts if HTML is too large
        const thoughts = entry.thoughts || '';
        const truncatedThoughts = thoughts.length > 10000 ? thoughts.substring(0, 10000) + '...' : thoughts;
        html = html.replace(
          new RegExp(escapeHTML(entry.thoughts || ''), 'g'),
          escapeHTML(truncatedThoughts)
        );
      }
      
      let uri: string;
      try {
        const result = await Print.printToFileAsync({
          html,
          base64: false,
        });
        
        if (!result || !result.uri) {
          throw new Error('PDF generation returned no file URI');
        }
        
        uri = result.uri;
        console.log('PDF generated successfully, URI:', uri?.substring(0, 50));
      } catch (printError: any) {
        console.error('PDF generation error:', printError);
        // Try with simplified HTML if first attempt fails
        const simplifiedHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #333; }
                .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
                .date { font-size: 14px; color: #6b7280; margin-bottom: 15px; }
                .thoughts { font-size: 16px; line-height: 1.8; white-space: pre-wrap; }
                .media-note { margin-top: 20px; padding: 12px; background-color: #f3f4f6; border-radius: 8px; font-size: 14px; color: #6b7280; }
              </style>
            </head>
            <body>
              <div class="title">${escapeHTML(entry.title || 'Journal Entry')}</div>
              <div class="date">${new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div class="thoughts">${escapeHTML((entry.thoughts || 'No thoughts recorded.').substring(0, 5000))}</div>
              ${entry.media && entry.media.length > 0 ? `<div class="media-note">This entry contains ${entry.media.length} attachment(s): ${entry.media.map(m => escapeHTML(m.name || 'Unknown')).join(', ')}</div>` : ''}
            </body>
          </html>
        `;
        
        const fallbackResult = await Print.printToFileAsync({
          html: simplifiedHTML,
          base64: false,
        });
        
        if (!fallbackResult || !fallbackResult.uri) {
          throw new Error('PDF generation failed even with simplified HTML');
        }
        
        uri = fallbackResult.uri;
        console.log('PDF generated with fallback HTML');
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Journal Entry${entry.title ? `: ${entry.title}` : ''}`,
        });
        console.log('PDF shared successfully');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error: any) {
      console.error('Error sharing journal:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      
      // Don't show alert for "another share request" error - user probably clicked twice
      if (!errorMessage.includes('Another share request')) {
        Alert.alert(
          'Error', 
          `Failed to share journal entry: ${errorMessage}. Please try again.`
        );
      }
    } finally {
      // Add a small delay before allowing another share to prevent rapid clicks
      setTimeout(() => {
        setSharing(false);
      }, 1000);
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
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        cancelText="Cancel"
        deleteText="Delete"
        onCancel={cancelDeleteEntry}
        onDelete={confirmDeleteEntry}
      />
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
                      disabled={sharing}
                      style={[styles.actionButton, sharing && styles.actionButtonDisabled]}
                    >
                      {sharing ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Share2 size={18} color={colors.primary} />
                      )}
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

                <View>
                  <Text 
                    style={[styles.entryThoughts, { color: colors.text }]}
                    numberOfLines={expandedEntries.has(entry.id) ? undefined : 3}
                  >
                    {entry.thoughts}
                  </Text>
                  {entry.thoughts && entry.thoughts.length > 150 && (
                    <TouchableOpacity
                      onPress={() => {
                        const newExpanded = new Set(expandedEntries);
                        if (newExpanded.has(entry.id)) {
                          newExpanded.delete(entry.id);
                        } else {
                          newExpanded.add(entry.id);
                        }
                        setExpandedEntries(newExpanded);
                      }}
                      style={styles.readMoreButton}
                    >
                      <Text style={[styles.readMoreText, { color: colors.primary }]}>
                        {expandedEntries.has(entry.id) ? t('journal.showLess') : t('journal.readAll')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
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

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        cancelText="Cancel"
        deleteText="Delete"
        onCancel={cancelDeleteEntry}
        onDelete={confirmDeleteEntry}
      />

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
  actionButtonDisabled: {
    opacity: 0.5,
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
  readMoreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
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
