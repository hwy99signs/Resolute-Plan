import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import type { User, Session } from '@supabase/supabase-js';
import { AuthService, ProfileService } from '../services';
import { NotificationService } from '../services/notification.service';
import { PushNotificationService } from '../services/push-notification.service';
import { supabase } from '../lib/supabase';
import type { Profile, ProfileUpdate } from '../types';

const isWeb = Platform.OS === 'web';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile
  const loadProfile = async (userId: string) => {
    try {
      const userProfile = await ProfileService.getProfile(userId);
      setProfile(userProfile);
    } catch (error: any) {
      // If profile doesn't exist yet (new user), that's okay - it will be created by trigger
      if (error?.code === 'PGRST116' || error?.message?.includes('0 rows')) {
        console.log('Profile not found yet, will be created by database trigger');
        // Don't set error - profile will be created automatically
        return;
      }
      console.error('Error loading profile:', error);
    }
  };

  // Refresh session when app comes to foreground
  const refreshSessionOnForeground = async () => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        // Don't log network errors as they're expected when offline
        if (!error.message?.includes('Network request failed') && !error.message?.includes('fetch')) {
          console.log('Session refresh error (may be normal if no session):', error.message);
        }
        return;
      }
      
      if (refreshedSession) {
        setSession(refreshedSession);
        if (refreshedSession.user) {
          setUser(refreshedSession.user);
          await loadProfile(refreshedSession.user.id);
        }
      }
    } catch (error: any) {
      // Silently handle network errors - don't break the app if offline
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        // Network error - user might be offline, keep existing session
        return;
      }
      console.error('Error refreshing session:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First, try to refresh any existing session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        // If refresh fails or no session, get current session
        const currentSession = refreshedSession || await AuthService.getSession();
        setSession(currentSession);
        
        if (currentSession?.user) {
          setUser(currentSession.user);
          await loadProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Try to get session anyway
        try {
          const fallbackSession = await AuthService.getSession();
          setSession(fallbackSession);
          if (fallbackSession?.user) {
            setUser(fallbackSession.user);
            await loadProfile(fallbackSession.user.id);
          }
        } catch (fallbackError) {
          console.error('Error getting fallback session:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        
        if (newSession?.user) {
          setUser(newSession.user);
          await loadProfile(newSession.user.id);
          // Register for push notifications
          await PushNotificationService.registerForPushNotifications(newSession.user.id);
        } else {
          // Only clear user if it's an explicit sign out
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
          }
        }
      }
    );

    // Set up app state listener to refresh session when app comes to foreground (mobile only)
    let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
    if (!isWeb) {
      appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          // App has come to the foreground, refresh session
          await refreshSessionOnForeground();
        }
      });
    }

    // Set up periodic session refresh (every 30 minutes) to keep session alive
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          // Only refresh if we have a session and are online
          // Don't fail if network is unavailable
          try {
            await refreshSessionOnForeground();
          } catch (error: any) {
            // Silently ignore network errors during periodic refresh
            if (!error?.message?.includes('Network request failed') && !error?.message?.includes('fetch')) {
              console.error('Error in periodic session refresh:', error);
            }
          }
        }
      } catch (error: any) {
        // Silently ignore errors - don't break the app
        if (!error?.message?.includes('Network request failed') && !error?.message?.includes('fetch')) {
          console.error('Error checking session:', error);
        }
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      subscription.unsubscribe();
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
      clearInterval(refreshInterval);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user: signedInUser, session: newSession } = await AuthService.signIn({
        email,
        password,
      });
      setUser(signedInUser);
      setSession(newSession);
      if (signedInUser) {
        await loadProfile(signedInUser.id);
        // Register for push notifications
        await PushNotificationService.registerForPushNotifications(signedInUser.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const signUpData = await AuthService.signUp({ email, password, fullName });
      const newUser = signUpData?.user;
      const newSession = signUpData?.session;
      
      // If user and session are returned, auto-log them in (email verification disabled)
      if (newUser && newSession) {
        setUser(newUser);
        setSession(newSession);
        // Load profile (will be created by trigger, but might need a moment)
        await loadProfile(newUser.id);
        // Register for push notifications
        await PushNotificationService.registerForPushNotifications(newUser.id);
      }
      
      // Create welcome notification for new user
      if (newUser) {
        try {
          await NotificationService.notifyWelcome(newUser.id, fullName);
        } catch (notifError) {
          console.error('Error creating welcome notification:', notifError);
          // Don't fail signup if notification fails
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user) throw new Error('No user logged in');
    
    const updatedProfile = await ProfileService.updateProfile(user.id, updates);
    setProfile(updatedProfile);
  };

  const refreshProfile = async () => {
    if (!user) return;
    await loadProfile(user.id);
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

