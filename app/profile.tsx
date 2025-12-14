import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Alert, Platform, ActionSheetIOS, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Pencil, Calendar, Target, TrendingUp, Trophy, ChevronRight, Crown, Camera, Bell, FileText, Share2, BookOpen, Settings, LogOut, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { StorageService } from '../src/services/storage.service';
import { useAnalytics } from '../src/hooks/useAnalytics';
import { useResolveStats } from '../src/hooks/useResolves';
import BottomTabBar from '../src/components/BottomTabBar';
import { SuccessModal } from '../src/components/SuccessModal';
import { DeleteConfirmationModal } from '../src/components/DeleteConfirmationModal';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, profile: userProfile, updateProfile, refreshProfile, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [showImageSuccessModal, setShowImageSuccessModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const { insights, loading: analyticsLoading } = useAnalytics();
  const { stats: resolveStats, loading: resolveStatsLoading } = useResolveStats();

  const handleLogout = () => {
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = async () => {
            await signOut();
            router.replace('/auth');
  };
  
  // Use profile from context or fallback to defaults
  const profile = {
    name: userProfile?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || 'No email',
    bio: (userProfile as any)?.bio || t('profile.committedToGrowth'),
    memberSince: userProfile?.created_at 
      ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : user?.created_at
      ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'January 2024',
    isPro: (userProfile as any)?.is_pro || userProfile?.premium || false,
    avatarUrl: userProfile?.avatar_url || null,
  };

  const handleImagePicker = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload a profile image');
      return;
    }

    // Show custom modal for both iOS and Android
    setShowImagePickerModal(true);
  };

  const handleImageSelection = async (source: 'camera' | 'gallery') => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload a profile image');
      return;
    }

    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        // Request camera permission
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') {
          Alert.alert('Permission Required', 'Please grant camera permissions to take a photo');
          return;
        }

        // Launch camera
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        // Request media library permission
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryStatus !== 'granted') {
          Alert.alert('Permission Required', 'Please grant camera roll permissions to choose an image');
          return;
        }

        // Launch image library
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const imageUri = result.assets[0].uri;
        
        // Upload image to Supabase storage
        const avatarUrl = await StorageService.uploadProfileImage(user.id, imageUri);
        
        // Update profile with new avatar URL
        // Profile service will create profile if it doesn't exist
        try {
          await updateProfile({ avatar_url: avatarUrl });
          
          // Refresh profile to get updated data
          await refreshProfile();
          
          setUploading(false);
          setShowImageSuccessModal(true);
        } catch (profileError: any) {
          // If profile update fails, the image was still uploaded
          // Try to refresh profile - it might have been created by trigger
          await refreshProfile();
          setUploading(false);
          
          // If it's a "no rows" error, profile might still be creating
          if (profileError?.code === 'PGRST116') {
            Alert.alert(
              'Upload Complete', 
              'Image uploaded successfully. Your profile will update shortly.'
            );
          } else {
            throw profileError; // Re-throw other errors
          }
        }
      }
    } catch (error: any) {
      setUploading(false);
      console.error('Error uploading image:', error);
      
      // Show more specific error messages
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Storage bucket not found') || error.message.includes('not configured')) {
          errorMessage = 'Storage is not configured. Please contact support.';
        } else if (error.message.includes('Permission denied') || error.message.includes('policy')) {
          errorMessage = 'Permission denied. Please check your account permissions.';
        } else if (error.message.includes('too large')) {
          errorMessage = 'Image is too large. Please choose an image smaller than 5MB.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  // Calculate stats from live data
  const dayStreak = insights?.dayStreak || 0;
  const activeResolves = resolveStats?.active || 0;
  const successRate = insights?.completionRate || 0;

  const stats = [
    { icon: '🔥', value: dayStreak.toString(), label: t('dashboard.streak'), color: '#FF6B6B' },
    { icon: '🎯', value: activeResolves.toString(), label: t('dashboard.activeResolves'), color: '#9163F2' },
    { icon: '📈', value: `${Math.round(successRate)}%`, label: t('profile.successRate'), color: '#96E6B3' },
  ];

  const quickActions = [
    {
      icon: Bell,
      title: t('settings.notifications'),
      subtitle: t('profile.viewAllNotifications'),
      route: '/notifications-feed',
      color: '#9163F2',
    },
    {
      icon: Trophy,
      title: t('profile.viewAchievements'),
      subtitle: t('profile.seeYourProgress'),
      route: '/achievements',
      color: '#FFD88A',
    },
  ];

  // New Tier 1 features menu items
  const tier1Features = [
    {
      icon: BookOpen,
      title: t('profile.reflectionJournal'),
      subtitle: t('profile.writeDailyReflections'),
      route: '/journal',
      color: '#4ECDC4',
      available: true, // ✅ Implemented
    },
    {
      icon: FileText,
      title: t('profile.exportPlans'),
      subtitle: t('profile.exportYourPlansToPdf'),
      route: '/export',
      color: '#FF6B6B',
      available: true, // ✅ Implemented
    },
    {
      icon: Share2,
      title: t('profile.sharePlans'),
      subtitle: t('profile.shareYourResolutions'),
      route: '/share',
      color: '#96E6B3',
      available: true, // ✅ Implemented (available in Resolve detail)
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with gradient background */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Pencil size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              style={styles.avatar}
              onPress={handleImagePicker}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : profile.avatarUrl ? (
                <Image 
                  source={{ uri: profile.avatarUrl }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
              )}
              <View style={styles.onlineIndicator} />
              <View style={styles.cameraIconContainer}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Name and Email */}
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>

          {/* Pro Badge */}
          {profile.isPro && (
            <View style={styles.proBadge}>
              <Crown size={16} color="#FFD88A" />
              <Text style={styles.proText}>resolviq Pro</Text>
            </View>
          )}

          {/* Bio */}
          <Text style={styles.bio}>{profile.bio}</Text>

          {/* Member Since */}
          <View style={styles.memberSince}>
            <Calendar size={14} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.memberSinceText}>{t('profile.memberSince')} {profile.memberSince}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.quickActions')}</Text>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <action.icon size={24} color={action.color} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{action.subtitle}</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Menu Items */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.menuCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/insights')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E0F2FE' }]}>
                <TrendingUp size={20} color="#0EA5E9" />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{t('profile.viewInsights')}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('profile.trackYourAnalytics')}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
                <Settings size={20} color="#9163F2" />
              </View>
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{t('settings.title')}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('settings.preferences')}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tier 1 Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.features')}</Text>
          {tier1Features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuCard, 
                { 
                  backgroundColor: colors.surface,
                  opacity: feature.available ? 1 : 0.6
                }
              ]}
              onPress={() => {
                if (feature.available) {
                  router.push(feature.route as any);
                } else {
                  Alert.alert('Coming Soon', `${feature.title} will be available soon!`);
                }
              }}
              disabled={!feature.available}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${feature.color}20` }]}>
                  <feature.icon size={20} color={feature.color} />
                </View>
                <View>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{feature.subtitle}</Text>
                </View>
              </View>
              {!feature.available && (
                <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>Soon</Text>
              )}
              {feature.available && <ChevronRight size={20} color={colors.textSecondary} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button at Bottom */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: '#FF6B6B' }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#FF6B6B" />
            <Text style={[styles.logoutButtonText, { color: '#FF6B6B' }]}>{t('settings.logOut')}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      
      <BottomTabBar />

      <SuccessModal
        visible={showImageSuccessModal}
        title={t('profile.imageUpdateTitle')}
        message={t('profile.imageUpdateMessage')}
        buttonText={t('common.done')}
        onButtonPress={() => setShowImageSuccessModal(false)}
      />

      <DeleteConfirmationModal
        visible={showSignOutConfirm}
        title={t('settings.logOut')}
        message={t('settings.signOutConfirmMessage')}
        cancelText={t('common.cancel')}
        deleteText={t('settings.logOut')}
        onCancel={() => setShowSignOutConfirm(false)}
        onDelete={confirmSignOut}
      />

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePickerModal(false)}
        >
          <View
            style={[styles.imagePickerModal, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.imagePickerTitle, { color: colors.text }]}>
              {t('profile.selectImage')}
            </Text>
            <Text style={[styles.imagePickerSubtitle, { color: colors.textSecondary }]}>
              {t('profile.chooseOption')}
            </Text>

            <TouchableOpacity
              style={[styles.imagePickerOption, { borderColor: colors.border }]}
              onPress={() => {
                setShowImagePickerModal(false);
                handleImageSelection('camera');
              }}
              activeOpacity={0.7}
            >
              <Camera size={24} color={colors.primary} />
              <Text style={[styles.imagePickerOptionText, { color: colors.text }]}>
                {t('profile.takePhoto')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imagePickerOption, { borderColor: colors.border }]}
              onPress={() => {
                setShowImagePickerModal(false);
                handleImageSelection('gallery');
              }}
              activeOpacity={0.7}
            >
              <ImageIcon size={24} color={colors.primary} />
              <Text style={[styles.imagePickerOptionText, { color: colors.text }]}>
                {t('profile.chooseFromGallery')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imagePickerCancel, { borderColor: colors.border }]}
              onPress={() => setShowImagePickerModal(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.imagePickerCancelText, { color: colors.textSecondary }]}>
                {t('profile.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F6',
  },
  header: {
    backgroundColor: '#9163F2',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#96E6B3',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3C2B63',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9163F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#9163F2',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 216, 138, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  proText: {
    color: '#FFD88A',
    fontSize: 14,
    fontWeight: '600',
  },
  bio: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberSinceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: -30,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1625',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1625',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1625',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingText: {
    fontSize: 15,
    color: '#1a1625',
    fontWeight: '500',
  },
  dangerItem: {
    marginTop: 8,
  },
  dangerText: {
    fontSize: 15,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(145, 99, 242, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1625',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  comingSoon: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F4F4F6',
    borderRadius: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    gap: 12,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  imagePickerModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  imagePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  imagePickerSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  imagePickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  imagePickerCancel: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  imagePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

