import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import type { Database } from '../types/database';

// For Expo/React Native - use expo-constants
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('supabaseUrl:', supabaseUrl ? '✓' : '✗');
  console.log('supabaseAnonKey:', supabaseAnonKey ? '✓' : '✗');
  throw new Error('Missing Supabase environment variables. Check your app.json or .env');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Mobile doesn't use URLs for auth
    storage: undefined, // Expo will handle storage automatically
    storageKey: 'supabase.auth.token', // Explicit storage key for session persistence
  },
});

console.log('✅ Supabase client initialized for Expo');

