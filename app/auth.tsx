import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { ErrorModal } from '../src/components/ErrorModal';
import { useTheme } from '../src/contexts/ThemeContext';

export default function AuthScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { signIn, signUp: signUpUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false); // Default to Sign In
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up - will auto-login if email verification is disabled
        await signUpUser(email, password, fullName || undefined);
        // If signup succeeds and user is auto-logged in, navigate to dashboard
        // The AuthContext will handle setting the user and session
        router.replace('/dashboard');
      } else {
        // Sign in
        await signIn(email, password);
        router.replace('/dashboard');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || t('auth.failedToAuthenticate');
      
      // Handle network errors specifically
      if (error.message?.includes('Network request failed') || error.message?.includes('fetch') || error.message?.includes('AuthRetryableFetchError')) {
        errorMessage = t('auth.networkError') || 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = t('auth.emailAlreadyExists') || 'This email is already registered. Please sign in instead.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = t('auth.invalidEmail') || 'Please enter a valid email address.';
      } else if (error.message?.includes('Password')) {
        errorMessage = t('auth.passwordError') || 'Password must be at least 8 characters long.';
      } else if (error.message?.includes('Database error') || error.message?.includes('saving new user')) {
        errorMessage = t('auth.databaseError') || 'There was an issue creating your account. Please try again or contact support if the problem persists.';
      }
      
      setErrorMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🎯</Text>
            <Text style={styles.title}>{t('auth.title')}</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.fullName')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.enterEmail')}
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={isSignUp ? t('auth.atLeast8Chars') : t('auth.enterPassword')}
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder={t('auth.reEnterPassword')}
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#3C2B63" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignUp ? t('auth.signUp') : t('auth.signIn')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Sign In/Sign Up */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setFullName('');
                  setPassword('');
                  setConfirmPassword('');
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                disabled={loading}
              >
                <Text style={styles.toggleLink}>
                  {isSignUp ? t('auth.signIn') : t('auth.signUp')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              {isSignUp ? t('auth.createAccountInfo') : t('auth.signInInfo')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ErrorModal
        visible={showErrorModal}
        title={t('auth.authenticationError')}
        message={errorMessage}
        buttonText={t('common.done')}
        onButtonPress={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3C2B63',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFD88A',
    fontWeight: '600',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  eyeIcon: {
    fontSize: 22,
  },
  submitButton: {
    backgroundColor: '#FFD88A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#3C2B63',
    fontSize: 18,
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  toggleLink: {
    color: '#FFD88A',
    fontSize: 14,
    fontWeight: '700',
  },
  infoContainer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 18,
  },
});

