import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { PaktCreationProvider } from '../src/contexts/PaktCreationContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import '../src/lib/i18n'; // Initialize i18n
import { PushNotificationService } from '../src/services/push-notification.service';
import { useNotifications } from '../src/hooks/useNotifications';

// Check if running in Expo Go (push notifications don't work in Expo Go)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configure notification handler (only if not in Expo Go)
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function NotificationHandler() {
  const router = useRouter();
  const { user } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Listen for new notifications and send push notifications
  // Hook must be called unconditionally, but it will handle Expo Go check internally
  useNotifications();

  // Schedule habit notifications and reminders when user is logged in (only if not in Expo Go)
  useEffect(() => {
    if (isExpoGo || !user) return;

    const setupNotifications = async () => {
      try {
        // Request notification permissions
        await PushNotificationService.requestPermissions();

        // Register for push notifications
        await PushNotificationService.registerForPushNotifications(user.id);

        // Setup habit notifications
        const { HabitNotificationService } = await import('../src/services/habit-notification.service');
        await HabitNotificationService.setupNotificationChannels();
        await HabitNotificationService.scheduleAllHabitNotifications();

        // Schedule reminder notifications
        const { ReminderNotificationService } = await import('../src/services/reminder-notification.service');
        await ReminderNotificationService.scheduleAllReminders(user.id);

        console.log('✅ All notifications scheduled');
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };
    setupNotifications();
  }, [user]);

  // Set up notification listeners (only if not in Expo Go)
  useEffect(() => {
    if (isExpoGo) {
      if (user) {
        console.log('Push notifications are not available in Expo Go. Use a development build for full notification support.');
      }
      return;
    }

    // Listen for notifications received while app is foregrounded
    notificationListener.current = PushNotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Push notification received:', notification);
      }
    );

    // Listen for user tapping on notification
    responseListener.current = PushNotificationService.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);

        // Navigate based on notification type
        if (data?.habitId) {
          router.push(`/habit-detail?id=${data.habitId}`);
        } else if (data?.pakt_id) {
          router.push(`/pakt-detail?id=${data.pakt_id}`);
        } else if (data?.type === 'pakt_created') {
          router.push('/dashboard');
        } else {
          router.push('/notifications-feed');
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router, user]);

  return null;
}

// Handle deep links for password reset
function DeepLinkHandler() {
  const router = useRouter();
  const hasHandledDeepLink = useRef(false);

  useEffect(() => {
    // Check if app was opened with a deep link
    const handleInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url && !hasHandledDeepLink.current) {
          console.log('Initial URL:', url);
          // Check if it's a password reset link
          if (url.includes('reset-password') && (url.includes('#access_token') || url.includes('type=recovery'))) {
            hasHandledDeepLink.current = true;
            console.log('Navigating to reset-password screen');
            // Small delay to ensure router is ready
            setTimeout(() => {
              router.replace('/reset-password');
            }, 100);
          }
        }
      } catch (e) {
        console.error('Error handling initial URL:', e);
      }
    };

    handleInitialURL();

    // Listen for incoming deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('URL event:', url);
      if (url.includes('reset-password') && (url.includes('#access_token') || url.includes('type=recovery'))) {
        console.log('Navigating to reset-password screen from URL event');
        router.replace('/reset-password');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}

function AppContent() {
  return (
    <PaktCreationProvider>
      <DeepLinkHandler />
      <NotificationHandler />
      <Stack screenOptions={{ headerShown: false }} />
    </PaktCreationProvider>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

