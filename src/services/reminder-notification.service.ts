import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderService } from './reminder.service';
import { ResolveService } from './resolve.service';
import { supabase } from '../lib/supabase';

/**
 * Service to schedule local device notifications for reminders
 * These notifications will fire even when the app is closed
 */
export class ReminderNotificationService {
  /**
   * Schedule all reminders for a user as device notifications
   */
  static async scheduleAllReminders(userId: string): Promise<void> {
    try {
      // Cancel all existing scheduled notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Get all enabled reminders for the user
      const reminders = await ReminderService.getUserReminders(userId);
      
      for (const reminder of reminders) {
        if (!reminder.enabled) continue;

        // Get the resolve to get its name
        const resolve = await ResolveService.getResolve(reminder.resolve_id);
        if (!resolve || resolve.status !== 'active') continue;

        // Schedule notification based on frequency
        await this.scheduleReminderNotification(reminder, resolve.name);
      }

      console.log(`✅ Scheduled ${reminders.filter(r => r.enabled).length} reminder notifications`);
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  /**
   * Schedule a single reminder notification
   */
  static async scheduleReminderNotification(
    reminder: any,
    resolveName: string
  ): Promise<void> {
    try {
      // Parse time (format: "8:00 AM" or "14:00")
      const timeMatch = reminder.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!timeMatch) {
        console.warn(`Invalid time format: ${reminder.time}`);
        return;
      }

      let hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]);
      const ampm = timeMatch[3]?.toUpperCase();

      // Convert to 24-hour format
      if (ampm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (ampm === 'AM' && hour === 12) {
        hour = 0;
      }

      if (reminder.frequency === 'daily') {
        // Schedule daily notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📅 Resolve Reminder`,
            body: `Time to check in on "${resolveName}"`,
            sound: true,
            badge: 1,
            data: {
              type: 'resolve_reminder',
              resolve_id: reminder.resolve_id,
              resolve_name: resolveName,
            },
          },
          trigger: {
            hour,
            minute,
            repeats: true,
          },
        });
      } else if (reminder.frequency === 'weekly') {
        // Schedule weekly notification (every Monday)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `📅 Weekly Resolve Reminder`,
            body: `Time to check in on "${resolveName}"`,
            sound: true,
            badge: 1,
            data: {
              type: 'resolve_reminder',
              resolve_id: reminder.resolve_id,
              resolve_name: resolveName,
            },
          },
          trigger: {
            weekday: 2, // Monday (1 = Sunday, 2 = Monday, etc.)
            hour,
            minute,
            repeats: true,
          },
        });
      } else if (reminder.frequency === 'custom' && reminder.days && reminder.days.length > 0) {
        // Schedule custom day notifications
        const dayMap: { [key: string]: number } = {
          'Mon': 2,
          'Tue': 3,
          'Wed': 4,
          'Thu': 5,
          'Fri': 6,
          'Sat': 7,
          'Sun': 1,
        };

        for (const dayShort of reminder.days) {
          const weekday = dayMap[dayShort];
          if (weekday) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `📅 Resolve Reminder`,
                body: `Time to check in on "${resolveName}"`,
                sound: true,
                badge: 1,
                data: {
                  type: 'resolve_reminder',
                  resolve_id: reminder.resolve_id,
                  resolve_name: resolveName,
                },
              },
              trigger: {
                weekday,
                hour,
                minute,
                repeats: true,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling reminder notification:', error);
    }
  }

  /**
   * Get a single reminder by ID
   */
  static async getReminder(reminderId: string): Promise<any> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Schedule a reminder notification when a reminder is created
   */
  static async scheduleReminderForNewReminder(reminderId: string): Promise<void> {
    try {
      const reminder = await this.getReminder(reminderId);
      if (!reminder || !reminder.enabled) return;

      const resolve = await ResolveService.getResolve(reminder.resolve_id);
      if (!resolve || resolve.status !== 'active') return;

      await this.scheduleReminderNotification(reminder, resolve.name);
    } catch (error) {
      console.error('Error scheduling new reminder:', error);
    }
  }

  /**
   * Cancel notifications for a specific reminder
   */
  static async cancelReminderNotifications(reminderId: string): Promise<void> {
    try {
      // Get all scheduled notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      // Cancel notifications that match this reminder
      for (const notification of scheduled) {
        if (notification.content.data?.reminder_id === reminderId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling reminder notifications:', error);
    }
  }

  /**
   * Cancel all reminder notifications
   */
  static async cancelAllReminderNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
}
