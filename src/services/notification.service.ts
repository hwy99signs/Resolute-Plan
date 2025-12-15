import { supabase } from '../lib/supabase';

export type NotificationType = 
  | 'password_changed'
  | 'resolve_created'
  | 'milestone_achieved'
  | 'milestone_missed'
  | 'milestone_upcoming'
  | 'resolve_completed'
  | 'achievement'
  | 'reminder'
  | 'streak_milestone'
  | 'welcome'
  | 'daily_habit_reminder'
  | 'daily_habit_completed'
  | 'daily_habit_missed';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: any;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(data: CreateNotificationData): Promise<Notification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || null,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return notification;
  }

  /**
   * Get user's notifications
   */
  static async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Helper: Create welcome notification for new users
   */
  static async notifyWelcome(userId: string, userName?: string): Promise<void> {
    const name = userName || 'there';
    await this.createNotification({
      user_id: userId,
      type: 'welcome',
      title: '🎉 Welcome to resolviq!',
      message: `Hi ${name}! Welcome to resolviq. We're excited to help you achieve your goals. Start by creating your first Resolve and breaking it down into milestones. Let's make this year your best one yet! 💪`,
      metadata: { welcome: true, created_at: new Date().toISOString() },
    });
  }

  /**
   * Helper: Create password changed notification
   */
  static async notifyPasswordChanged(userId: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'password_changed',
      title: 'Password Changed',
      message: 'Your password has been successfully changed.',
    });
  }

  /**
   * Helper: Create Resolve created notification with congratulations and milestone info
   */
  static async notifyResolveCreated(
    userId: string, 
    resolveName: string, 
    resolveId: string,
    milestoneCount?: number
  ): Promise<void> {
    let message = `🎉 Congratulations! You've created a new Resolve: "${resolveName}"`;
    
    if (milestoneCount && milestoneCount > 0) {
      message += `\n\nYou've set up ${milestoneCount} milestone${milestoneCount > 1 ? 's' : ''} to help you achieve this goal. Keep up the momentum! 💪`;
    } else {
      message += `\n\nStart adding milestones to break down your goal into achievable steps! 🎯`;
    }
    
    await this.createNotification({
      user_id: userId,
      type: 'resolve_created',
      title: '🎊 New Resolve Created!',
      message: message,
      metadata: { resolve_id: resolveId, milestone_count: milestoneCount || 0 },
    });
  }

  /**
   * Helper: Create milestone achieved notification
   */
  static async notifyMilestoneAchieved(
    userId: string,
    milestoneName: string,
    resolveName: string,
    milestoneId: string,
    resolveId: string
  ): Promise<void> {
    // Create notification in database
    await this.createNotification({
      user_id: userId,
      type: 'milestone_achieved',
      title: 'Milestone Achieved! 🎉',
      message: `You've completed "${milestoneName}" in "${resolveName}"`,
      metadata: { milestone_id: milestoneId, resolve_id: resolveId },
    });

    // Send device notification
    try {
      const { PushNotificationService } = await import('./push-notification.service');
      await PushNotificationService.sendLocalNotification(
        'Milestone Achieved! 🎉',
        `You've completed "${milestoneName}" in "${resolveName}"`,
        { type: 'milestone_achieved', milestone_id: milestoneId, resolve_id: resolveId }
      );
    } catch (error) {
      console.error('Error sending device notification:', error);
      // Don't fail if device notification fails
    }
  }

  /**
   * Helper: Create milestone missed notification
   */
  static async notifyMilestoneMissed(
    userId: string,
    milestoneName: string,
    resolveName: string,
    milestoneId: string,
    resolveId: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'milestone_missed',
      title: 'Milestone Missed',
      message: `The deadline for "${milestoneName}" in "${resolveName}" has passed.`,
      metadata: { milestone_id: milestoneId, resolve_id: resolveId },
    });
  }

  /**
   * Helper: Create milestone upcoming notification
   */
  static async notifyMilestoneUpcoming(
    userId: string,
    milestoneName: string,
    resolveName: string,
    daysUntil: number,
    milestoneId: string,
    resolveId: string
  ): Promise<void> {
    const message = daysUntil === 0
      ? `"${milestoneName}" in "${resolveName}" is due today!`
      : `"${milestoneName}" in "${resolveName}" is due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}.`;

    await this.createNotification({
      user_id: userId,
      type: 'milestone_upcoming',
      title: 'Milestone Deadline Approaching',
      message,
      metadata: { milestone_id: milestoneId, resolve_id: resolveId, days_until: daysUntil },
    });
  }

  /**
   * Helper: Create Resolve completed notification
   */
  static async notifyResolveCompleted(userId: string, resolveName: string, resolveId: string): Promise<void> {
    // Create notification in database
    await this.createNotification({
      user_id: userId,
      type: 'pakt_completed',
      title: 'Resolve Completed! 🎊',
      message: `Congratulations! You've completed "${resolveName}"`,
      metadata: { resolve_id: resolveId },
    });

    // Send device notification
    try {
      const { PushNotificationService } = await import('./push-notification.service');
      await PushNotificationService.sendLocalNotification(
        'Resolve Completed! 🎊',
        `Congratulations! You've completed "${resolveName}"`,
        { type: 'pakt_completed', resolve_id: resolveId }
      );
    } catch (error) {
      console.error('Error sending device notification:', error);
      // Don't fail if device notification fails
    }
  }

  /**
   * Helper: Create achievement earned notification
   */
  static async notifyAchievementEarned(
    userId: string,
    achievementTitle: string,
    achievementDescription: string,
    achievementIcon: string,
    achievementId: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'achievement',
      title: `${achievementIcon} Achievement Unlocked!`,
      message: `${achievementTitle}: ${achievementDescription}`,
      metadata: { achievement_id: achievementId, icon: achievementIcon },
    });
  }

  /**
   * Helper: Create reminder notification
   */
  static async notifyReminder(
    userId: string,
    resolveName: string,
    message: string,
    resolveId: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'reminder',
      title: `Reminder: ${resolveName}`,
      message: message,
      metadata: { resolve_id: resolveId },
    });
  }

  /**
   * Helper: Create streak milestone notification
   */
  static async notifyStreakMilestone(
    userId: string,
    streakDays: number,
    message: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'streak_milestone',
      title: `🔥 ${streakDays} Day Streak!`,
      message: message,
      metadata: { streak_days: streakDays },
    });
  }

  /**
   * Trigger notification processing (for manual/cron calls)
   * This calls the database function that processes all notifications
   */
  static async processAllNotifications(): Promise<void> {
    const { error } = await supabase.rpc('process_all_notifications');
    if (error) throw error;
  }

  /**
   * Trigger reminder notifications only
   */
  static async processReminderNotifications(): Promise<void> {
    const { error } = await supabase.rpc('send_reminder_notifications');
    if (error) throw error;
  }

  /**
   * Trigger daily motivation
   */
  static async processDailyMotivation(): Promise<void> {
    const { error } = await supabase.rpc('send_daily_motivation');
    if (error) throw error;
  }

  /**
   * Helper: Create daily habit reminder notification
   */
  static async notifyDailyHabitReminder(
    userId: string,
    habitName: string,
    habitId: string,
    scheduledTime: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'daily_habit_reminder',
      title: `⏰ Time for "${habitName}"`,
      message: `Don't forget to complete your daily habit "${habitName}" scheduled for ${scheduledTime}`,
      metadata: { habit_id: habitId, scheduled_time: scheduledTime },
    });
  }

  /**
   * Helper: Create daily habit completed notification
   */
  static async notifyDailyHabitCompleted(
    userId: string,
    habitName: string,
    habitId: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'daily_habit_completed',
      title: `✅ "${habitName}" Completed!`,
      message: `Great job! You've completed your daily habit "${habitName}" today. Keep up the momentum! 💪`,
      metadata: { habit_id: habitId },
    });
  }

  /**
   * Helper: Create daily habit missed notification
   */
  static async notifyDailyHabitMissed(
    userId: string,
    habitName: string,
    habitId: string
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      type: 'daily_habit_missed',
      title: `⏰ "${habitName}" Missed`,
      message: `You missed your daily habit "${habitName}" today. Don't worry, you can get back on track tomorrow!`,
      metadata: { habit_id: habitId },
    });
  }
}

