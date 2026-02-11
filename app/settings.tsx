import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sun, Moon, Bell, Globe, CreditCard, Shield, FileText, ChevronRight, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { AuthService } from '../src/services/auth.service';
import { NotificationService } from '../src/services/notification.service';
import BottomTabBar from '../src/components/BottomTabBar';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, themeMode, setThemeMode, colors } = useTheme();
  const { user } = useAuth();
  const { currentLanguage, t } = useLanguage();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);


  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setChangingPassword(true);
    try {
      if (!user?.email) {
        throw new Error('User not found');
      }

      // Verify current password by attempting to sign in
      try {
        await AuthService.signIn({ email: user.email, password: currentPassword });
      } catch (verifyError: any) {
        throw new Error('Current password is incorrect');
      }

      // Update to new password
      await AuthService.updatePassword(newPassword);
      
      // Create notification
      try {
        await NotificationService.notifyPasswordChanged(user.id);
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the password change if notification fails
      }
      
      Alert.alert('Success', 'Password changed successfully', [
        {
          text: 'OK',
          onPress: () => {
            setShowChangePasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }
        }
      ]);
    } catch (error: any) {
      console.error('Password change error:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to change password. Please try again.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: colors.background },
    headerSubtitle: { ...styles.headerSubtitle },
    sectionTitle: { ...styles.sectionTitle, color: colors.textSecondary },
    card: { ...styles.card, backgroundColor: colors.surface },
    settingText: { ...styles.settingText, color: colors.text },
    menuText: { ...styles.menuText, color: colors.text },
    languageText: { ...styles.languageText, color: colors.textSecondary },
    footerTitle: { ...styles.footerTitle, color: colors.textSecondary },
    footerVersion: { ...styles.footerVersion, color: colors.textSecondary },
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Header with gradient */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
          <Text style={dynamicStyles.headerSubtitle}>{t('settings.subtitle')}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t('settings.appearance')}</Text>
          
          <View style={dynamicStyles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                {isDarkMode ? (
                  <Moon size={20} color={colors.primary} />
                ) : (
                  <Sun size={20} color={colors.primary} />
                )}
                <Text style={dynamicStyles.settingText}>{t('settings.darkMode')}</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
                trackColor={{ false: '#E5E5E5', true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E5E5"
              />
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t('settings.preferences')}</Text>
          
          <View style={dynamicStyles.card}>
            <TouchableOpacity 
              style={[styles.menuRow, styles.menuRowBorder]}
              onPress={() => router.push('/notifications')}
            >
              <View style={styles.menuLeft}>
                <Bell size={20} color={colors.textSecondary} />
                <Text style={dynamicStyles.menuText}>{t('settings.notifications')}</Text>
              </View>
              <ChevronRight size={20} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuRow}
              onPress={() => router.push('/language')}
            >
              <View style={styles.menuLeft}>
                <Globe size={20} color={colors.textSecondary} />
                <Text style={dynamicStyles.menuText}>{t('settings.language')}</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={[dynamicStyles.languageText, { color: colors.textSecondary }]}>
                  {currentLanguage === 'en' ? 'English' : currentLanguage === 'fr' ? 'Français' : 'Español'}
                </Text>
                <ChevronRight size={20} color="#CCC" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t('settings.account')}</Text>
          
          <View style={dynamicStyles.card}>
            <TouchableOpacity 
              style={[styles.menuRow, styles.menuRowBorder]}
              onPress={() => setShowChangePasswordModal(true)}
            >
              <View style={styles.menuLeft}>
                <Lock size={20} color={colors.textSecondary} />
                <Text style={dynamicStyles.menuText}>{t('settings.changePassword')}</Text>
              </View>
              <ChevronRight size={20} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuRow, styles.menuRowBorder]}
              onPress={() => router.push('/premium')}
            >
              <View style={styles.menuLeft}>
                <CreditCard size={20} color={colors.textSecondary} />
                <Text style={dynamicStyles.menuText}>{t('settings.manageSubscription')}</Text>
              </View>
              <ChevronRight size={20} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuRow, styles.menuRowBorder]}
              onPress={() => router.push('/policy')}
            >
              <View style={styles.menuLeft}>
                <Shield size={20} color={colors.textSecondary} />
                <Text style={dynamicStyles.menuText}>{t('settings.privacy')}</Text>
              </View>
              <ChevronRight size={20} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuRow}
              onPress={() => router.push('/terms')}
            >
              <View style={styles.menuLeft}>
                <FileText size={20} color={colors.textSecondary} />
                <Text style={dynamicStyles.menuText}>{t('settings.termsOfService')}</Text>
              </View>
              <ChevronRight size={20} color="#CCC" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Footer */}
        <View style={styles.footer}>
          <Text style={dynamicStyles.footerTitle}>Resolute Plan pro</Text>
          <Text style={dynamicStyles.footerVersion}>Version 1.0.0</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      
      <BottomTabBar />

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.changePassword')}</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={[styles.modalClose, { color: colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.passwordInputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('settings.currentPassword')}</Text>
                <View style={[styles.passwordInputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder={t('settings.enterCurrentPassword')}
                    placeholderTextColor={colors.textSecondary}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordInputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
                <View style={[styles.passwordInputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder="Enter new password (min 6 characters)"
                    placeholderTextColor={colors.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordInputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('settings.confirmPassword')}</Text>
                <View style={[styles.passwordInputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder={t('settings.confirmNewPassword')}
                    placeholderTextColor={colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordHint}>
                <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                  {t('settings.passwordHint')}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={changingPassword}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  { backgroundColor: colors.primary },
                  changingPassword && styles.modalSaveButtonDisabled
                ]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>{t('settings.changePassword')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingBottom: 32,
    paddingHorizontal: 24,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingText: {
    fontSize: 16,
    color: '#1a1625',
    fontWeight: '500',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  languageRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#1a1625',
    fontWeight: '400',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageText: {
    fontSize: 15,
    color: '#666',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1625',
  },
  modalClose: {
    fontSize: 24,
    color: '#9163F2',
    fontWeight: '300',
  },
  modalBody: {
    padding: 24,
  },
  passwordInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1625',
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F6',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1625',
  },
  passwordHint: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F4F4F6',
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F4F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1625',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#9163F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

