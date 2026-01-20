import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, RefreshControl, Animated, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HelpCircle } from 'lucide-react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { useResolves } from '../src/hooks/useResolves';
import { useAnalytics } from '../src/hooks/useAnalytics';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { translateCategory, translateResolveName } from '../src/utils/translations';
import { rp, wp, isSmallScreen } from '../src/utils/responsive';
import BottomTabBar from '../src/components/BottomTabBar';
import SupportChatbot from '../src/components/SupportChatbot';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { resolves, loading: resolvesLoading, refetch: refetchResolves } = useResolves();
  const { insights, loading: analyticsLoading, refresh: refreshAnalytics } = useAnalytics();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  
  // Animated values for collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 120;
  const HEADER_MIN_HEIGHT = 60;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
  
  // Animated header styles
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const insets = useSafeAreaInsets();
  const minPadding = Math.max(rp(16), insets.left); // Ensure minimum padding from safe area
  const maxPadding = Math.max(rp(24), insets.left + 8);
  
  const headerPadding = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [maxPadding, minPadding],
    extrapolate: 'clamp',
  });
  
  const greetingOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  const greetingFontSize = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [16, 0],
    extrapolate: 'clamp',
  });
  
  const nameFontSize = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [24, 18],
    extrapolate: 'clamp',
  });
  
  const profileSize = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [40, 32],
    extrapolate: 'clamp',
  });

  const loading = resolvesLoading || analyticsLoading;

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both Resolves and analytics data
      await Promise.all([
        refetchResolves(),
        refreshAnalytics()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate stats from real data
  const activeResolvesList = resolves.filter(p => p.status === 'active');
  const stats = {
    streak: insights?.dayStreak ?? 0,
    totalPakts: activeResolvesList.length,
    completedToday: insights?.milestonesDone || 0, // Use milestones completed from analytics
    activeHabits: activeResolvesList.length, // Active habits (using active resolves as habits)
  };

  // Helper to get category icon
  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'Health & Fitness': '🏃',
      'Personal Growth': '🧠',
      'Finance': '💰',
      'Career': '💼',
      'Relationships': '❤️',
      'Hobbies': '🎨',
      'Education': '📚',
      'Wellness': '🧘',
    };
    return icons[category] || '🎯';
  };

  // Helper to get category color
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Health & Fitness': '#FF6B6B',
      'Personal Growth': '#4ECDC4',
      'Finance': '#FFD93D',
      'Career': '#9163F2',
      'Relationships': '#FF6AC1',
      'Hobbies': '#FFB84D',
      'Education': '#6BCF7F',
      'Wellness': '#A78BFA',
    };
    return colors[category] || '#9163F2';
  };

  // Calculate progress percentage for each Resolve
  const getPaktProgress = (resolve: any) => {
    // Use database progress if available (updated by trigger), otherwise calculate from milestones
    if (resolve.progress !== undefined && resolve.progress !== null) {
      return resolve.progress;
    }
    if (!resolve.milestones || resolve.milestones.length === 0) return 0;
    const completed = resolve.milestones.filter((m: any) => m.completed).length;
    return Math.round((completed / resolve.milestones.length) * 100);
  };

  // Get due date text
  const getDueDateText = (targetDate: string | null): string => {
    if (!targetDate) return t('dashboard.noDeadline');
    
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return t('dashboard.overdue');
    if (diffDays === 0) return t('dashboard.today');
    if (diffDays === 1) return t('dashboard.tomorrow');
    if (diffDays <= 7) return `${diffDays} ${t('dashboard.days')}`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} ${t('dashboard.weeks')}`;
    return `${Math.ceil(diffDays / 30)} ${t('dashboard.months')}`;
  };

  // Filter active Resolves
  const activeResolves = resolves.filter(p => p.status === 'active');

  // Helper to get profile image
  const getProfileImage = () => {
    if (profile?.avatar_url) {
      return { uri: profile.avatar_url };
    }
    return null;
  };

  // Helper to get profile initials
  const getProfileInitials = () => {
    const name = profile?.full_name || user?.email?.split('@')[0] || 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Dynamic styles based on theme and responsive design
  const dynamicStyles = {
    container: { ...styles.container, backgroundColor: colors.background },
    loadingText: { ...styles.loadingText, color: colors.textSecondary },
    header: { ...styles.header, backgroundColor: colors.surface },
    greeting: { ...styles.greeting, color: colors.textSecondary },
    name: { ...styles.name, color: colors.text },
    statsCard: { ...styles.statCard, backgroundColor: colors.surface },
    statValue: { ...styles.statValue, color: colors.text },
    statLabel: { ...styles.statLabel, color: colors.textSecondary },
    sectionTitle: { ...styles.sectionTitle, color: colors.text },
    seeAllText: { ...styles.seeAllText, color: colors.primary },
    paktCard: { ...styles.paktCard, backgroundColor: colors.surface },
    paktName: { ...styles.paktName, color: colors.text },
    paktCategory: { ...styles.paktCategory, color: colors.textSecondary },
    paktMilestones: { ...styles.paktMilestones, color: colors.textSecondary },
    paktDue: { ...styles.paktDue, color: colors.primary },
    emptyState: { ...styles.emptyState, backgroundColor: colors.surface },
    emptyTitle: { ...styles.emptyTitle, color: colors.text },
    emptyText: { ...styles.emptyText, color: colors.textSecondary },
    progressBar: { ...styles.progressBar, backgroundColor: colors.border },
    progressValue: { ...styles.progressValue, color: colors.primary },
  };

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={dynamicStyles.loadingText}>{t('dashboard.loadingResolves')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top', 'left', 'right']}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          dynamicStyles.header,
          {
            height: headerHeight,
            paddingHorizontal: headerPadding,
            paddingVertical: headerPadding,
          }
        ]}
      >
        <View style={{ flex: 1, justifyContent: 'center', minWidth: 0, paddingRight: 8 }}>
          <Animated.View
            style={{
              opacity: greetingOpacity,
              height: greetingOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 20],
              }),
              marginBottom: greetingOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
            }}
          >
            <Text 
              style={[dynamicStyles.greeting, { fontSize: isSmallScreen ? 14 : 16 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {t('dashboard.welcomeBack')}
            </Text>
          </Animated.View>
          <Animated.Text 
            style={[
              dynamicStyles.name,
              { fontSize: nameFontSize }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            ellipsizeMode="tail"
          >
            {profile?.full_name || user?.email?.split('@')[0] || 'Keep up the great work'}
          </Animated.Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.profileButton, { backgroundColor: colors.background }]}
            onPress={() => router.push('/profile')}
          >
            {getProfileImage() ? (
              <Animated.View
                style={{
                  width: profileSize,
                  height: profileSize,
                  borderRadius: profileSize.interpolate({
                    inputRange: [32, 40],
                    outputRange: [16, 20],
                  }),
                  overflow: 'hidden',
                }}
              >
                <Image 
                  source={getProfileImage()!} 
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  resizeMode="cover"
                />
              </Animated.View>
            ) : (
              <Animated.View 
                style={[
                  styles.profileImagePlaceholder, 
                  { 
                    backgroundColor: colors.primary,
                    width: profileSize,
                    height: profileSize,
                    borderRadius: profileSize.interpolate({
                      inputRange: [32, 40],
                      outputRange: [16, 20],
                    }),
                  }
                ]}
              >
                <Animated.Text 
                  style={[
                    styles.profileInitials,
                    {
                      fontSize: profileSize.interpolate({
                        inputRange: [32, 40],
                        outputRange: [14, 16],
                      }),
                    }
                  ]}
                >
                  {getProfileInitials()}
                </Animated.Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <Animated.ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingTop: 0 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >

        {/* Stats Cards Carousel */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsCarouselContainer}
          style={styles.statsCarousel}
          snapToInterval={122}
          decelerationRate="fast"
          snapToAlignment="start"
          pagingEnabled={false}
        >
          <View style={[dynamicStyles.statsCard, styles.statCardWithMargin]}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={dynamicStyles.statValue}>{stats.streak}</Text>
            <Text style={dynamicStyles.statLabel}>{t('dashboard.streak')}</Text>
          </View>
          <View style={[dynamicStyles.statsCard, styles.statCardWithMargin]}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={dynamicStyles.statValue}>{stats.totalPakts}</Text>
            <Text style={dynamicStyles.statLabel}>{t('dashboard.activeResolves')}</Text>
          </View>
          <View style={[dynamicStyles.statsCard, styles.statCardWithMargin]}>
            <Text style={styles.statIcon}>✓</Text>
            <Text style={dynamicStyles.statValue}>{stats.completedToday}</Text>
            <Text style={dynamicStyles.statLabel}>{t('dashboard.today')}</Text>
          </View>
          <View style={[dynamicStyles.statsCard, styles.statCardWithMargin]}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={dynamicStyles.statValue}>{stats.activeHabits}</Text>
            <Text style={dynamicStyles.statLabel}>{t('dashboard.activeHabits')}</Text>
        </View>
        </ScrollView>


        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>{t('dashboard.activeResolves')}</Text>
            {activeResolves.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/all-resolves')}>
                <Text style={dynamicStyles.seeAllText}>{t('dashboard.seeAll')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeResolves.length === 0 ? (
            <View style={dynamicStyles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={dynamicStyles.emptyTitle}>No Resolves Yet</Text>
              <Text style={dynamicStyles.emptyText}>
                Create your first Resolve to start tracking your goals
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/category-selection')}
              >
                <Text style={styles.createButtonText}>Create First Resolve</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeResolves.slice(0, 3).map((resolve) => {
              const progress = getPaktProgress(resolve);
              const icon = getCategoryIcon(resolve.category || '');
              const color = getCategoryColor(resolve.category || '');
              // @ts-ignore: milestones might be injected by extended type or external source
              const milestones = (resolve as any).milestones || [];
              const completedMilestones = milestones.filter((m: any) => m.completed).length;
              const totalMilestones = milestones.length;
              const dueDate = getDueDateText(resolve.deadline);

              return (
                <TouchableOpacity 
                  key={resolve.id} 
                  style={dynamicStyles.paktCard}
                  onPress={() => router.push(`/pakt-detail?id=${resolve.id}`)}
                >
                  <View style={styles.paktHeader}>
                    <View style={[styles.paktIcon, { backgroundColor: color }]}>
                      <Text style={styles.paktIconText}>{icon}</Text>
                    </View>
                    <View style={styles.paktInfo}>
                      <Text style={dynamicStyles.paktName}>{translateResolveName(resolve.name)}</Text>
                      <Text style={dynamicStyles.paktCategory}>{translateCategory(resolve.category)}</Text>
                    </View>
                    <View style={styles.paktProgress}>
                      <Text style={dynamicStyles.progressValue}>{progress}%</Text>
                    </View>
                  </View>

                  <View style={dynamicStyles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${progress}%`, backgroundColor: color }
                      ]} 
                    />
                  </View>

                  <View style={styles.paktFooter}>
                    <Text style={dynamicStyles.paktMilestones}>
                      {completedMilestones}/{totalMilestones} {t('dashboard.milestones')}
                    </Text>
                    <Text style={dynamicStyles.paktDue}>{t('dashboard.dueIn')} {dueDate}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t('dashboard.discoverMore')}</Text>
          
          <TouchableOpacity 
            style={styles.premiumBanner}
            onPress={() => router.push('/premium')}
          >
            <View>
              <Text style={styles.premiumBadge}>⭐ PREMIUM</Text>
              <Text style={styles.premiumTitle}>{t('dashboard.unlockPremium')}</Text>
              <Text style={styles.premiumText}>
                {t('dashboard.unlockPremiumDesc')}
              </Text>
            </View>
            <Text style={styles.premiumArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* Support Chatbot FAB */}
      <TouchableOpacity
        style={[
          styles.chatbotFAB, 
          { 
            backgroundColor: colors.primary,
            bottom: Math.max(insets.bottom + 80, 100), // Position above BottomTabBar with safe area
          }
        ]}
        onPress={() => setShowChatbot(true)}
        activeOpacity={0.8}
      >
        <HelpCircle size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <BottomTabBar />

      {/* Support Chatbot Modal */}
      <SupportChatbot visible={showChatbot} onClose={() => setShowChatbot(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3C2B63',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 24,
    gap: 12,
  },
  statsCarousel: {
    marginTop: 24,
  },
  statsCarouselContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: 110,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  statCardWithMargin: {
    marginRight: 12,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#9163F2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paktCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  paktHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paktIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paktIconText: {
    fontSize: 24,
  },
  paktInfo: {
    flex: 1,
  },
  paktName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  paktCategory: {
    fontSize: 14,
  },
  paktProgress: {
    alignItems: 'flex-end',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  paktFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paktMilestones: {
    fontSize: 14,
  },
  paktDue: {
    fontSize: 14,
    fontWeight: '500',
  },
  premiumBanner: {
    backgroundColor: '#9163F2',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD88A',
    marginBottom: 8,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  premiumText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  premiumArrow: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  chatbotFAB: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9163F2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
});

