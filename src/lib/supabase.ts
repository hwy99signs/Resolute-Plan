import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Database } from '../types/database';

// Check if we're in a web or native environment
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Get environment variables - works for both Vite and Expo
const supabaseUrl = isWeb 
  ? (import.meta.env?.VITE_SUPABASE_URL as string) 
  : (Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL);

const supabaseAnonKey = isWeb 
  ? (import.meta.env?.VITE_SUPABASE_ANON_KEY as string)
  : (Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('Environment:', isWeb ? 'Web' : 'Native');
  console.log('supabaseUrl:', supabaseUrl ? '✓ Found' : '✗ Missing');
  console.log('supabaseAnonKey:', supabaseAnonKey ? '✓ Found' : '✗ Missing');
  console.log('Constants.expoConfig?.extra:', JSON.stringify(Constants.expoConfig?.extra));
  throw new Error('Missing Supabase environment variables. Check your .env.local or app.json');
}

console.log('✅ Supabase client initializing for:', isWeb ? 'Web' : 'Expo Native');
console.log('✅ URL:', supabaseUrl);
console.log('✅ Key loaded:', supabaseAnonKey ? 'YES' : 'NO');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isWeb ? window.localStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,
    storageKey: 'supabase.auth.token', // Explicit storage key for session persistence
    flowType: 'pkce', // Use PKCE flow for better security and session persistence
  },
});
