import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
// Import legacy API for backward compatibility
import * as FileSystemLegacy from 'expo-file-system/legacy';

export class StorageService {
  /**
   * Check if the avatars bucket exists, create it if it doesn't
   */
  private static async ensureBucketExists(): Promise<void> {
    try {
      // Try to list files in the bucket to check if it exists
      const { data, error } = await supabase.storage.from('avatars').list('', {
        limit: 1,
      });

      // If bucket doesn't exist, we'll get an error
      // In production, the bucket should be created via migration
      if (error && (error.message?.includes('not found') || ((error as any)?.statusCode === 404))) {
        console.warn('Avatars bucket not found. Please create it in Supabase dashboard.');
        throw new Error('Storage bucket not configured. Please contact support or check Supabase storage setup.');
      }
    } catch (error: any) {
      // If it's our custom error, rethrow it
      if (error.message?.includes('Storage bucket not configured')) {
        throw error;
      }
      // Otherwise, log and continue (bucket might exist but have no files)
      console.log('Bucket check:', error.message);
    }
  }

  /**
   * Upload a profile image to Supabase storage
   * @param userId - The user's ID
   * @param imageUri - The local URI of the image to upload
   * @returns The public URL of the uploaded image
   */
  static async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    try {
      // Ensure bucket exists
      await this.ensureBucketExists();

      // Read the file - handle both web and native
      let fileData: Blob | Uint8Array;
      let contentType = 'image/jpeg';

      if (Platform.OS === 'web') {
        // For web, fetch the file and convert to Blob
        const response = await fetch(imageUri);
        fileData = await response.blob();
        contentType = response.headers.get('content-type') || 'image/jpeg';
      } else {
        // For React Native, use fetch to read the file and convert to blob/uint8array
        try {
          // Method 1: Try using fetch (works for file:// URIs in React Native)
          const response = await fetch(imageUri);
          if (response.ok) {
            const blob = await response.blob();
            // Convert blob to Uint8Array
            const arrayBuffer = await blob.arrayBuffer();
            fileData = new Uint8Array(arrayBuffer);
            contentType = blob.type || 'image/jpeg';
          } else {
            throw new Error('Failed to fetch image');
          }
        } catch (fetchError) {
          // Method 2: Fallback to FileSystem legacy API if fetch fails
          try {
            // Read file as base64 using legacy FileSystem API
            const base64 = await FileSystemLegacy.readAsStringAsync(imageUri, {
              encoding: FileSystemLegacy.EncodingType.Base64,
            });
            
            // Convert base64 to Uint8Array
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            fileData = new Uint8Array(byteNumbers);
          } catch (fileSystemError: any) {
            // If both methods fail, provide helpful error
            throw new Error(
              `Failed to read image file: ${fileSystemError?.message || 'Unknown error'}. ` +
              'Please ensure the image file is accessible and try again.'
            );
          }
        }
      
        // Determine content type from file extension
        const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeTypes: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
        };
        contentType = mimeTypes[fileExt] || 'image/jpeg';
      }
      
      // Create a unique filename with user folder structure
      // Format: {userId}/{timestamp}.{ext}
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileData, {
          contentType,
          upsert: true,
          cacheControl: '3600',
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('not found') || (error as any).statusCode === 404) {
          throw new Error('Storage bucket not found. Please ensure the "avatars" bucket exists in Supabase.');
        } else if (error.message?.includes('permission') || error.message?.includes('policy')) {
          throw new Error('Permission denied. Please check storage policies in Supabase.');
        } else if (error.message?.includes('size') || error.message?.includes('too large')) {
          throw new Error('Image file is too large. Please choose a smaller image.');
        } else {
          throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
        }
      }

      if (!data) {
        throw new Error('Upload failed: No data returned from storage');
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error in uploadProfileImage:', error);
      
      // Re-throw with user-friendly message if it's already our custom error
      if (error.message && !error.message.includes('Error in uploadProfileImage')) {
      throw error;
      }
      
      // Otherwise, wrap in a user-friendly error
      throw new Error(error.message || 'Failed to upload image. Please check your internet connection and try again.');
    }
  }

  /**
   * Delete a profile image from Supabase storage
   * @param imageUrl - The public URL of the image to delete
   */
  static async deleteProfileImage(imageUrl: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('avatars')).join('/');

      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteProfileImage:', error);
      throw error;
    }
  }

  /**
   * Check if the journal-media bucket exists
   */
  private static async ensureJournalMediaBucketExists(): Promise<void> {
    try {
      const { data, error } = await supabase.storage.from('journal-media').list('', {
        limit: 1,
      });

      if (error && (error.message?.includes('not found') || (error as any)?.statusCode === 404)) {
        console.warn('Journal media bucket not found. Please create it in Supabase dashboard.');
        throw new Error('Storage bucket not configured. Please contact support or check Supabase storage setup.');
      }
    } catch (error: any) {
      if (error.message?.includes('Storage bucket not configured')) {
        throw error;
      }
      console.log('Bucket check:', error.message);
    }
  }

  /**
   * Upload journal media (image, video, or document) to Supabase storage
   * @param userId - The user's ID
   * @param entryId - The journal entry ID
   * @param fileUri - The local URI of the file to upload
   * @param fileName - The name of the file
   * @param mimeType - The MIME type of the file
   * @returns The public URL of the uploaded file
   */
  static async uploadJournalMedia(
    userId: string,
    entryId: string,
    fileUri: string,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    try {
      await this.ensureJournalMediaBucketExists();

      let fileData: Blob | Uint8Array;
      let detectedMimeType = mimeType;

      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        fileData = blob;
        // Use blob's MIME type if available and valid, otherwise use provided mimeType
        if (blob.type && blob.type !== 'application/octet-stream' && blob.type !== '') {
          detectedMimeType = blob.type;
        }
      } else {
        try {
          const response = await fetch(fileUri);
          if (response.ok) {
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            fileData = new Uint8Array(arrayBuffer);
            // Use blob's MIME type if available and valid
            if (blob.type && blob.type !== 'application/octet-stream' && blob.type !== '') {
              detectedMimeType = blob.type;
            }
          } else {
            throw new Error('Failed to fetch file');
          }
        } catch (fetchError) {
          const base64 = await FileSystemLegacy.readAsStringAsync(fileUri, {
            encoding: FileSystemLegacy.EncodingType.Base64,
          });
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          fileData = new Uint8Array(byteNumbers);
        }
      }

      // If MIME type is still application/octet-stream, try to detect from file extension
      if (detectedMimeType === 'application/octet-stream') {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const mimeTypeMap: Record<string, string> = {
          // Images
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
          bmp: 'image/bmp',
          // Videos
          mp4: 'video/mp4',
          mov: 'video/quicktime',
          avi: 'video/x-msvideo',
          mkv: 'video/x-matroska',
          webm: 'video/webm',
          m4v: 'video/x-m4v',
          // Documents
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          txt: 'text/plain',
          rtf: 'application/rtf',
          odt: 'application/vnd.oasis.opendocument.text',
        };
        if (ext && mimeTypeMap[ext]) {
          detectedMimeType = mimeTypeMap[ext];
        }
      }

      // Create file path: {userId}/{entryId}/{timestamp}_{fileName}
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${entryId}/${timestamp}_${sanitizedFileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('journal-media')
        .upload(filePath, fileData, {
          contentType: detectedMimeType,
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        console.error('Storage upload error:', error);
        if (error.message?.includes('not found') || (error as any).statusCode === 404) {
          throw new Error('Storage bucket not found. Please create the "journal-media" bucket in Supabase Dashboard > Storage. See JOURNAL_MEDIA_FIX.md for instructions.');
        } else if (error.message?.includes('permission') || error.message?.includes('policy') || error.message?.includes('denied')) {
          throw new Error('Permission denied. Please ensure: 1) The "journal-media" bucket exists and is public, 2) Storage policies are set up (run migration 032_create_journal_media_bucket.sql). See JOURNAL_MEDIA_FIX.md for details.');
        } else if (error.message?.includes('size') || error.message?.includes('too large')) {
          throw new Error('File is too large. Maximum size is 50MB.');
        } else if (error.message?.includes('mime type') || error.message?.includes('not supported') || error.message?.includes('content type')) {
          throw new Error(`Upload failed: MIME type "${detectedMimeType}" is not supported. The file type "${fileName.split('.').pop()}" may not be allowed in the storage bucket. Please check bucket settings or use a different file format.`);
        } else {
          throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
        }
      }

      if (!data) {
        throw new Error('Upload failed: No data returned from storage');
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('journal-media')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error in uploadJournalMedia:', error);
      throw new Error(error.message || 'Failed to upload media. Please check your internet connection and try again.');
    }
  }

  /**
   * Delete journal media from Supabase storage
   * @param mediaUrl - The public URL of the media to delete
   */
  static async deleteJournalMedia(mediaUrl: string): Promise<void> {
    try {
      const urlParts = mediaUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('journal-media') + 1).join('/');

      const { error } = await supabase.storage
        .from('journal-media')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting media:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteJournalMedia:', error);
      throw error;
    }
  }
}
