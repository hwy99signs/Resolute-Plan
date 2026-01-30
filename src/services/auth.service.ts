import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Sign up a new user
   * Email verification is disabled - users can use the platform immediately
   */
  static async signUp({ email, password, fullName }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // No email verification redirect
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    
    // If user is returned, they're automatically confirmed (email verification disabled)
    // The session should be available immediately
    return data;
  }

  /**
   * Sign in an existing user
   */
  static async signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out the current user
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get the current user
   */
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  /**
   * Get the current session
   */
  static async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  /**
   * Reset password request
   * For React Native, uses deep linking with the app scheme
   */
  static async resetPassword(email: string) {
    // For web: use EXPO_PUBLIC_SITE_URL or fallback to window.location.origin
    // For mobile: use the app scheme for deep linking
    let redirectTo: string;
    
    // Check if we're in a browser environment (not React Native)
    // In React Native, window exists but window.location is undefined
    const isWeb = typeof window !== 'undefined' && typeof window.location?.origin === 'string';
    
    if (isWeb) {
      // Web platform - use environment variable or current origin
      const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || window.location.origin;
      redirectTo = `${siteUrl}/reset-password`;
    } else {
      // Mobile platform - use app scheme
      redirectTo = 'resolutionstracker://reset-password';
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  /**
   * Update user metadata
   */
  static async updateUserMetadata(metadata: { full_name?: string; avatar_url?: string }) {
    const { error } = await supabase.auth.updateUser({
      data: metadata,
    });
    if (error) throw error;
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}

