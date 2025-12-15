import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, CheckCircle, XCircle, Clock, Target, Lock, Trophy, AlertCircle, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { NotificationService } from '../src/services/notification.service';
import { translateResolveName } from '../src/utils/translations';
import BottomTabBar from '../src/components/BottomTabBar';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: any;
}

export default function NotificationsFeedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Fetch notifications from the database
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // If table doesn't exist, show empty state
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await NotificationService.markAsRead(notificationId, user.id);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await NotificationService.markAllAsRead(user.id);
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <Trophy size={20} color="#9163F2" />;
      case 'password_changed':
        return <Lock size={20} color="#9163F2" />;
      case 'pakt_created':
        return <Target size={20} color="#96E6B3" />;
      case 'milestone_achieved':
        return <CheckCircle size={20} color="#96E6B3" />;
      case 'milestone_missed':
        return <XCircle size={20} color="#FF6B6B" />;
      case 'daily_habit_reminder':
        return <Clock size={20} color="#9163F2" />;
      case 'daily_habit_completed':
        return <CheckCircle size={20} color="#96E6B3" />;
      case 'daily_habit_missed':
        return <XCircle size={20} color="#FF6B6B" />;
      case 'milestone_upcoming':
        return <Clock size={20} color="#FFD88A" />;
      case 'pakt_completed':
        return <Trophy size={20} color="#96E6B3" />;
      case 'achievement':
        return <Trophy size={20} color="#FFD88A" />;
      case 'reminder':
        return <Bell size={20} color="#9163F2" />;
      case 'streak_milestone':
        return <TrendingUp size={20} color="#FF6B6B" />;
      default:
        return <Bell size={20} color={colors.primary} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) {
      // Format: "X minutes ago" or "hace X minutos"
      const minutesText = t('notifications.minutesAgo');
      return minutesText.replace('{{count}}', diffMins.toString());
    }
    if (diffHours < 24) {
      // Format: "X hours ago" or "hace X horas"
      const hoursText = t('notifications.hoursAgo');
      return hoursText.replace('{{count}}', diffHours.toString());
    }
    if (diffDays < 7) {
      // Format: "X days ago" or "hace X días"
      const daysText = t('notifications.daysAgo');
      return daysText.replace('{{count}}', diffDays.toString());
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Translate notification content
  const translateNotification = (notification: Notification) => {
    let translatedTitle = notification.title;
    let translatedMessage = notification.message;
    
    // Handle cases where translation keys are already in the notification
    if (notification.title === 'notificationsFeed.paktReminder' || notification.title === 'notificationsFeed.resolveReminder') {
      translatedTitle = t('notificationsFeed.resolveReminder');
    }
    if (notification.message === 'notificationsFeed.paktReminderMessage' || notification.message === 'notificationsFeed.resolveReminderMessage') {
      // Try to extract resolve name from metadata if available
      const resolveName = notification.metadata?.resolve_name || notification.metadata?.pakt_name || 'your Resolve';
      const count = notification.metadata?.count || '1';
      translatedMessage = t('notificationsFeed.resolveReminderMessage')
        .replace('{{count}}', count.toString())
        .replace('{{resolve}}', translateResolveName(resolveName));
    }

    // Translate notification titles
    if (notification.title.includes('Daily Motivation')) {
      translatedTitle = t('notificationsFeed.dailyMotivation');
    } else if (notification.title.includes('Milestone Due Today')) {
      translatedTitle = t('notificationsFeed.milestoneDueToday');
    } else if (notification.title.includes('Milestone Due Tomorrow')) {
      translatedTitle = t('notificationsFeed.milestoneDueTomorrow');
    } else if (notification.title.includes('Milestone Deadline Approaching')) {
      translatedTitle = t('notificationsFeed.milestoneDeadlineApproaching');
    } else if (notification.title.includes('Milestone Missed')) {
      translatedTitle = t('notificationsFeed.milestoneMissed');
    } else if (notification.title.includes('Milestone Achieved')) {
      translatedTitle = t('notificationsFeed.milestoneAchieved');
    } else if (notification.title.includes('Resolve Reminder')) {
      translatedTitle = t('notificationsFeed.resolveReminder');
    }

    // Translate notification messages
    if (notification.message.includes('is due today!')) {
      const match = notification.message.match(/"([^"]+)" in "([^"]+)"/);
      if (match) {
        const milestoneName = match[1];
        const paktName = translateResolveName(match[2]);
        translatedMessage = t('notificationsFeed.milestoneDueTodayMessage')
          .replace('{{milestone}}', milestoneName)
          .replace('{{resolve}}', paktName);
      }
    } else if (notification.message.includes('is due tomorrow')) {
      const match = notification.message.match(/"([^"]+)" in "([^"]+)"/);
      if (match) {
        const milestoneName = match[1];
        const paktName = translateResolveName(match[2]);
        translatedMessage = t('notificationsFeed.milestoneDueMessage')
          .replace('{{milestone}}', milestoneName)
          .replace('{{resolve}}', paktName);
      }
    } else if (notification.message.includes('is due in')) {
      const match = notification.message.match(/"([^"]+)" in "([^"]+)" is due in (\d+) days/);
      if (match) {
        const milestoneName = match[1];
        const paktName = translateResolveName(match[2]);
        const days = match[3];
        translatedMessage = t('notificationsFeed.milestoneDeadlineApproachingMessage')
          .replace('{{milestone}}', milestoneName)
          .replace('{{resolve}}', paktName)
          .replace('{{days}}', days);
      }
    } else if (notification.message.includes('deadline for') && notification.message.includes('has passed')) {
      const match = notification.message.match(/"([^"]+)" in "([^"]+)"/);
      if (match) {
        const milestoneName = match[1];
        const paktName = translateResolveName(match[2]);
        translatedMessage = t('notificationsFeed.milestoneMissedMessage')
          .replace('{{milestone}}', milestoneName)
          .replace('{{resolve}}', paktName);
      }
    } else if (notification.message.includes("You've completed")) {
      const match = notification.message.match(/"([^"]+)" in "([^"]+)"/);
      if (match) {
        const milestoneName = match[1];
        const paktName = translateResolveName(match[2]);
        translatedMessage = t('notificationsFeed.milestoneCompletedMessage')
          .replace('{{milestone}}', milestoneName)
          .replace('{{resolve}}', paktName);
      }
    } else if (notification.message.includes('milestone to work on today') || notification.message.includes('milestones to work on today')) {
      // Handle both singular and plural
      const match = notification.message.match(/(\d+) milestones? to work on today in "([^"]+)"/);
      if (match) {
        const count = match[1];
        const paktName = translateResolveName(match[2]);
        translatedMessage = t('notificationsFeed.resolveReminderMessage')
          .replace('{{count}}', count)
          .replace('{{resolve}}', paktName);
      } else {
        // Try singular form
        const match2 = notification.message.match(/You have (\d+) milestone to work on today in "([^"]+)"/);
        if (match2) {
          const count = match2[1];
          const paktName = translateResolveName(match2[2]);
          translatedMessage = t('notificationsFeed.resolveReminderMessage')
            .replace('{{count}}', count)
            .replace('{{resolve}}', paktName);
        }
      }
    } else if (notification.message.includes("Don't wait for motivation")) {
      translatedMessage = t('notificationsFeed.motivation1');
    } else if (notification.message.includes("You're not just dreaming")) {
      translatedMessage = t('notificationsFeed.motivation2');
    } else if (notification.message.includes("Every small step you take")) {
      translatedMessage = t('notificationsFeed.motivation3');
    } else if (notification.message.includes("Your commitment to growth")) {
      translatedMessage = t('notificationsFeed.motivation4');
    } else if (notification.message.includes("Every day is a chance")) {
      translatedMessage = t('notificationsFeed.motivation5');
    } else if (notification.message.includes("You're building the life")) {
      translatedMessage = t('notificationsFeed.motivation6');
    }

    return { title: translatedTitle, message: translatedMessage };
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadBadge}>{unreadCount} {t('notifications.new')}</Text>
          )}
        </View>
        
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 80 }} />}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('notifications.loading')}
          </Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={64} color={colors.textSecondary} opacity={0.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('notifications.noNotifications')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('notifications.noNotificationsDesc')}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotifications();
              }}
              tintColor={colors.primary}
            />
          }
        >
          {notifications.map((notification) => {
            const translated = translateNotification(notification);
            return (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                !notification.read && styles.unreadCard
              ]}
              onPress={() => markAsRead(notification.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                {getNotificationIcon(notification.type)}
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: colors.text }]}>
                    {translated.title}
                </Text>
                <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                    {translated.message}
                </Text>
                <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                  {formatTime(notification.created_at)}
                </Text>
              </View>
              {!notification.read && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9163F2',
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
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
});
