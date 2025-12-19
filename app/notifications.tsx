import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, BellOff, Clock, Target, Trophy, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useAuth } from '../src/contexts/AuthContext';
import { SettingsService, type NotificationPreferences } from '../src/services/settings.service';
import { PushNotificationService } from '../src/services/push-notification.service';
import BottomTabBar from '../src/components/BottomTabBar';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    paktReminders: true,
    milestoneReminders: true,
    dailyMotivation: true,
    weeklyReports: true,
    achievements: true,
    streakReminders: true,
    dailyHabitReminders: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  // Load notification preferences from backend
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const prefs = await SettingsService.getNotificationPreferences(user.id);
        setSettings({
          pushEnabled: prefs.push_enabled,
          emailEnabled: prefs.email_enabled,
          paktReminders: prefs.pakt_reminders,
          milestoneReminders: prefs.milestone_deadlines,
          dailyMotivation: prefs.daily_motivation,
          weeklyReports: prefs.weekly_progress,
          achievements: prefs.achievement_alerts,
          streakReminders: prefs.streak_protection,
          dailyHabitReminders: prefs.daily_habit_reminders,
          quietHoursStart: prefs.quiet_hours_start,
          quietHoursEnd: prefs.quiet_hours_end,
        });
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const toggleSetting = async (key: keyof typeof settings) => {
    if (!user) return;

    const newValue = !(settings[key] as boolean);
    const updatedSettings = { ...settings, [key]: newValue };
    setSettings(updatedSettings);

    // Map frontend keys to backend keys
    const keyMapping: Record<string, keyof NotificationPreferences> = {
      pushEnabled: 'push_enabled',
      emailEnabled: 'email_enabled',
      paktReminders: 'pakt_reminders',
      milestoneReminders: 'milestone_deadlines',
      dailyMotivation: 'daily_motivation',
      weeklyReports: 'weekly_progress',
      achievements: 'achievement_alerts',
      streakReminders: 'streak_protection',
      dailyHabitReminders: 'daily_habit_reminders',
    };

    const backendKey = keyMapping[key];
    if (backendKey) {
      try {
        setSaving(true);
        await SettingsService.updateNotificationPreferences(user.id, {
          [backendKey]: newValue,
          enabled: updatedSettings.pushEnabled, // Master toggle
        });
      } catch (error) {
        console.error('Error saving notification preferences:', error);
        // Revert on error
        setSettings(settings);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSendTestNotification = async () => {
    if (!user || !settings.pushEnabled) return;

    try {
      setSendingTest(true);

      // Get list of enabled notification types
      const enabledTypes: string[] = [];
      if (settings.paktReminders) enabledTypes.push(t('notifications.resolveReminders') || t('notifications.paktReminders') || 'Resolve Reminders');
      if (settings.milestoneReminders) enabledTypes.push(t('notifications.milestoneDeadlines'));
      if (settings.dailyMotivation) enabledTypes.push(t('notifications.dailyMotivation'));
      if (settings.weeklyReports) enabledTypes.push(t('notifications.weeklyProgressReports'));
      if (settings.achievements) enabledTypes.push(t('notifications.achievementAlerts'));
      if (settings.streakReminders) enabledTypes.push(t('notifications.streakProtection'));
      if (settings.dailyHabitReminders) enabledTypes.push(t('notifications.dailyHabitReminders'));

      // Send a test notification
      const notificationTitle = enabledTypes.length > 0
        ? t('notifications.testNotificationTitle') || 'Test Notification'
        : t('notifications.testNotificationTitle') || 'Test Notification';
      
      const notificationBody = enabledTypes.length > 0
        ? `${t('notifications.testNotificationBody') || 'You have the following notifications enabled:'}\n${enabledTypes.join(', ')}`
        : t('notifications.testNotificationBodyDefault') || 'This is a test notification. Enable notification types to see more details.';

      await PushNotificationService.sendLocalNotification(
        notificationTitle,
        notificationBody,
        {
          type: 'test',
          test: true,
          enabledTypes: enabledTypes,
        }
      );

      Alert.alert(
        t('notifications.testNotificationSent') || 'Test Notification Sent',
        t('notifications.testNotificationSentDesc') || 'Check your notification tray to see the test notification.',
        [{ text: t('common.ok') || 'OK' }]
      );
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      Alert.alert(
        t('notifications.testNotificationError') || 'Error',
        t('notifications.testNotificationErrorDesc') || `Failed to send test notification: ${error.message}`,
        [{ text: t('common.ok') || 'OK' }]
      );
    } finally {
      setSendingTest(false);
    }
  };

  type NotificationItem = {
    key: keyof typeof settings;
    icon: typeof Bell;
    color: string;
    title: string;
    description: string;
  };

  const notificationGroups: Array<{
    title: string;
    items: NotificationItem[];
  }> = [
    {
      title: t('notifications.general'),
      items: [
        {
          key: 'pushEnabled',
          icon: Bell,
          color: '#9163F2',
          title: t('notifications.pushNotifications'),
          description: t('notifications.pushNotificationsDesc'),
        },
        {
          key: 'emailEnabled',
          icon: Bell,
          color: '#FFD88A',
          title: t('notifications.emailNotifications'),
          description: t('notifications.emailNotificationsDesc'),
        },
      ],
    },
    {
      title: t('notifications.resolveReminders') || 'Resolve Reminders',
      items: [
        {
          key: 'paktReminders',
          icon: Target,
          color: '#9163F2',
          title: t('notifications.resolveReminders') || t('notifications.paktReminders') || 'Resolve Reminders',
          description: t('notifications.resolveRemindersDesc') || t('notifications.paktRemindersDesc') || 'Get reminded about your active Resolves',
        },
        {
          key: 'milestoneReminders',
          icon: Clock,
          color: '#96E6B3',
          title: t('notifications.milestoneDeadlines'),
          description: t('notifications.milestoneDeadlinesDesc'),
        },
        {
          key: 'streakReminders',
          icon: TrendingUp,
          color: '#FF6B6B',
          title: t('notifications.streakProtection'),
          description: t('notifications.streakProtectionDesc'),
        },
        {
          key: 'dailyHabitReminders',
          icon: Clock,
          color: '#9163F2',
          title: t('notifications.dailyHabitReminders'),
          description: t('notifications.dailyHabitRemindersDesc'),
        },
      ],
    },
    {
      title: t('notifications.progressMotivation'),
      items: [
        {
          key: 'dailyMotivation',
          icon: TrendingUp,
          color: '#FFD88A',
          title: t('notifications.dailyMotivation'),
          description: t('notifications.dailyMotivationDesc'),
        },
        {
          key: 'weeklyReports',
          icon: Trophy,
          color: '#96E6B3',
          title: t('notifications.weeklyProgressReports'),
          description: t('notifications.weeklyProgressReportsDesc'),
        },
        {
          key: 'achievements',
          icon: Trophy,
          color: '#FFD88A',
          title: t('notifications.achievementAlerts'),
          description: t('notifications.achievementAlertsDesc'),
        },
      ],
    },
  ];

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
        
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* All Notifications Toggle */}
        <View style={[styles.masterToggle, { backgroundColor: colors.surface }]}>
          <View style={styles.masterToggleContent}>
            {settings.pushEnabled ? (
              <Bell size={24} color={colors.primary} />
            ) : (
              <BellOff size={24} color={colors.textSecondary} />
            )}
            <View style={styles.masterToggleText}>
              <Text style={[styles.masterToggleTitle, { color: colors.text }]}>
                {settings.pushEnabled ? t('notifications.notificationsEnabled') : t('notifications.notificationsDisabled')}
              </Text>
              <Text style={[styles.masterToggleDescription, { color: colors.textSecondary }]}>
                {settings.pushEnabled 
                  ? t('notifications.notificationsEnabledDesc')
                  : t('notifications.enableToStartReceiving')}
              </Text>
            </View>
          </View>
          <Switch
            value={settings.pushEnabled}
            onValueChange={() => toggleSetting('pushEnabled')}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Notification Groups */}
        {notificationGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{group.title}</Text>
            {group.items.map((item, itemIndex) => {
              const IconComponent = item.icon;
              return (
                <View 
                  key={item.key} 
                  style={[
                    styles.notificationItem,
                    { backgroundColor: colors.surface },
                    !settings.pushEnabled && styles.notificationItemDisabled
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                    <IconComponent size={20} color={item.color} />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[
                      styles.notificationTitle,
                      { color: colors.text },
                      !settings.pushEnabled && { color: colors.textSecondary }
                    ]}>
                      {item.title}
                    </Text>
                    <Text style={[
                      styles.notificationDescription,
                      { color: colors.textSecondary },
                      !settings.pushEnabled && { color: colors.textSecondary }
                    ]}>
                      {item.description}
                    </Text>
                  </View>
                  <Switch
                    value={settings[item.key] as boolean}
                    onValueChange={() => toggleSetting(item.key)}
                    disabled={!settings.pushEnabled}
                    trackColor={{ false: colors.border, true: item.color }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              );
            })}
          </View>
        ))}

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('notifications.quietHours')}</Text>
          <TouchableOpacity 
            style={[styles.quietHoursCard, { backgroundColor: colors.surface }]}
            disabled={!settings.pushEnabled}
          >
            <Clock size={20} color={settings.pushEnabled ? colors.primary : colors.textSecondary} />
            <View style={styles.quietHoursContent}>
              <Text style={[
                styles.quietHoursTitle,
                { color: colors.text },
                !settings.pushEnabled && { color: colors.textSecondary }
              ]}>
                {t('notifications.setQuietHours')}
              </Text>
              <Text style={[
                styles.quietHoursDescription,
                { color: colors.textSecondary },
                !settings.pushEnabled && { color: colors.textSecondary }
              ]}>
                {t('notifications.pauseNotificationsDuringTimes')}
              </Text>
            </View>
            <Text style={[
              styles.quietHoursTime,
              { color: colors.primary },
              !settings.pushEnabled && { color: colors.textSecondary }
            ]}>
              10 PM - 8 AM
            </Text>
          </TouchableOpacity>
        </View>

        {/* Test Notification */}
        <View style={styles.testSection}>
          <TouchableOpacity 
            style={[
              styles.testButton,
              { backgroundColor: colors.surface, borderColor: settings.pushEnabled ? colors.primary : colors.border },
              !settings.pushEnabled && styles.testButtonDisabled
            ]}
            disabled={!settings.pushEnabled || sendingTest}
            onPress={handleSendTestNotification}
          >
            {sendingTest ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Bell size={20} color={settings.pushEnabled ? colors.primary : colors.textSecondary} />
            )}
            <Text style={[
              styles.testButtonText,
              { color: settings.pushEnabled ? colors.primary : colors.textSecondary },
              !settings.pushEnabled && { color: colors.textSecondary }
            ]}>
              {sendingTest ? t('notifications.sendingTest') : t('notifications.sendTestNotification')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  masterToggle: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  masterToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  masterToggleText: {
    marginLeft: 16,
    flex: 1,
  },
  masterToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  masterToggleDescription: {
    fontSize: 13,
    lineHeight: 18,
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
  notificationItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationItemDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  textDisabled: {
    color: '#999',
  },
  quietHoursCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quietHoursContent: {
    flex: 1,
    marginLeft: 12,
  },
  quietHoursTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  quietHoursDescription: {
    fontSize: 13,
  },
  quietHoursTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9163F2',
  },
  testSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  testButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
  },
  testButtonDisabled: {
    borderColor: '#E0E0E0',
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

