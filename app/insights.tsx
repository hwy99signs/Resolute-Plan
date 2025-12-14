import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, Target, Calendar, Award, BarChart3, Clock } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAnalytics } from '../src/hooks/useAnalytics';
import { useResolves } from '../src/hooks/useResolves';
import { useAchievements } from '../src/hooks/useAchievements';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import BottomTabBar from '../src/components/BottomTabBar';
import { wp, hp, rf, rp, getSpacing, getIconSize, isSmallScreen, isLargeScreen } from '../src/utils/responsive';

export default function InsightsScreen() {
  const router = useRouter();
  const { insights, loading: analyticsLoading } = useAnalytics();
  const { resolves, loading: paktsLoading } = useResolves();
  const { achievements, loading: achievementsLoading } = useAchievements();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const loading = analyticsLoading || paktsLoading || achievementsLoading;

  // Get screen width for responsive calculations
  const screenWidth = Dimensions.get('window').width;
  const statCardWidth = (screenWidth - rp(16) * 2 - getSpacing(12)) / 2; // 2 cards per row with padding and gap

  // Animated values for collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = rp(140);
  const HEADER_MIN_HEIGHT = rp(70);
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
  
  // Animated header styles
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const headerPadding = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [16, 12],
    extrapolate: 'clamp',
  });
  
  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  const subtitleHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [20, 0],
    extrapolate: 'clamp',
  });
  
  const baseTitleSize = rf(28);
  const minTitleSize = rf(20);
  const titleFontSize = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [baseTitleSize, minTitleSize],
    extrapolate: 'clamp',
  });
  
  const backButtonSize = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [40, 36],
    extrapolate: 'clamp',
  });

  // Calculate completion rate from resolves
  const completionRate = () => {
    if (!resolves || !Array.isArray(resolves)) return 0;
    
    const activeResolves = resolves.filter(p => p.status === 'active');
    if (activeResolves.length === 0) return 0;
    
    let totalMilestones = 0;
    let completedMilestones = 0;

    // Calculate from actual milestones if available
    activeResolves.forEach(resolve => {
      const resolveWithMilestones = resolve as any;
      if (resolveWithMilestones.milestones && Array.isArray(resolveWithMilestones.milestones)) {
        totalMilestones += resolveWithMilestones.milestones.length;
        completedMilestones += resolveWithMilestones.milestones.filter((m: any) => m.completed).length;
      } else {
        // Fallback: treat each active resolve as a single "milestone"
        totalMilestones += 1;
        if (resolve.progress >= 100) {
          completedMilestones += 1;
        }
      }
    });

    return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  };

  const stats = [
    { 
      icon: TrendingUp, 
      value: `${completionRate()}%`, 
      label: t('insights.completionRate'),
      colors: ['#9163F2', '#5A4180'],
    },
    {
      icon: Target,
      value: String(insights?.milestonesDone || 0), 
      label: t('insights.milestonesDone'),
      colors: ['#FF6B6B', '#FF8E53'],
    },
    { 
      icon: Calendar, 
      value: String(insights?.dayStreak || 0), 
      label: t('dashboard.streak'),
      colors: ['#7C3AED', '#9163F2'],
    },
    { 
      icon: Award, 
      value: String((achievements && Array.isArray(achievements) ? achievements.filter(a => a.earned_at !== null).length : 0)), 
      label: t('insights.badgesEarned'),
      colors: ['#FFB84D', '#FFA533'],
    },
  ];

  // Get weekly activity data from insights (last 7 days)
  // insights.weeklyActivity is an array of 7 numbers representing activity for each day
  const weeklyActivityData = insights?.weeklyActivity || [0, 0, 0, 0, 0, 0, 0];
  
  // Map to day names (Monday = 0, Sunday = 6)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = weeklyActivityData.map((value, index) => ({
    day: dayNames[index],
    value: value || 0,
  }));

  const maxValue = Math.max(...weeklyData.map(d => d.value), 1);

  // Helper function for category colors
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

  // Calculate category breakdown
  const categoryMap = new Map<string, number>();
  if (resolves && Array.isArray(resolves)) {
    resolves.filter(p => p.status === 'active').forEach(resolve => {
    const category = resolve.category || 'Other';
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });
  }

  const totalResolves = resolves && Array.isArray(resolves) ? resolves.filter(p => p.status === 'active').length : 0;
  const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    count,
    percentage: totalResolves > 0 ? Math.round((count / totalResolves) * 100) : 0,
    color: getCategoryColor(name),
  }));

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('insights.loadingInsights')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no categories, show at least a placeholder
  if (categories.length === 0) {
    categories.push({ name: 'No Data', count: 0, percentage: 0, color: '#E0E0E0' });
  }

  // Calculate productivity times from completion data
  // For now, we'll use a simplified calculation based on completion rate
  // In the future, this could be enhanced with actual time-of-day data from activity_log
  const completionRateValue = completionRate();
  const productivityTimes = [
    { 
      time: t('insights.morningTime') || 'Morning (6AM - 12PM)', 
      percentage: Math.min(100, Math.round(completionRateValue * 0.7)), 
      color: '#FFD88A' 
    },
    { 
      time: t('insights.afternoonTime') || 'Afternoon (12PM - 6PM)', 
      percentage: Math.min(100, Math.round(completionRateValue * 0.5)), 
      color: '#96E6B3' 
    },
    { 
      time: t('insights.eveningTime') || 'Evening (6PM - 12AM)', 
      percentage: Math.min(100, Math.round(completionRateValue * 0.3)), 
      color: '#9163F2' 
    },
  ];

  // Calculate consistency score from streak and completion rate
  // Consistency = (streak / max possible streak) * 50 + (completion rate) * 50
  const streakValue = insights?.dayStreak || 0;
  const maxStreak = insights?.longestStreak || 0;
  const streakScore = maxStreak > 0 ? Math.min(100, (streakValue / Math.max(maxStreak, 7)) * 100) : 0;
  const completionScore = completionRateValue;
  const consistencyScore = Math.round((streakScore * 0.4) + (completionScore * 0.6));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            height: headerHeight,
            paddingHorizontal: headerPadding,
            paddingTop: headerPadding,
            paddingBottom: headerPadding,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Animated.View
            style={{
              width: backButtonSize,
              height: backButtonSize,
              borderRadius: backButtonSize.interpolate({
                inputRange: [36, 40],
                outputRange: [18, 20],
              }),
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Animated.Text 
            style={[
              styles.headerTitle,
              { fontSize: titleFontSize }
            ]}
          >
            {t('insights.title')}
          </Animated.Text>
          <Animated.View
            style={{
              opacity: subtitleOpacity,
              height: subtitleHeight,
              marginTop: subtitleOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
            }}
          >
            <Text style={styles.headerSubtitle}>{t('insights.subtitle')}</Text>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <View 
                key={index} 
                style={[
                  styles.statCard, 
                  { 
                    backgroundColor: colors.surface,
                    width: statCardWidth,
                    marginRight: index % 2 === 0 ? getSpacing(12) : 0,
                    marginBottom: getSpacing(12),
                  }
                ]}
              >
                <View style={[styles.statIconContainer, { 
                  backgroundColor: `${stat.colors[0]}20` 
                }]}>
                  <IconComponent size={getIconSize(24)} color={stat.colors[0]} strokeWidth={2.5} />
                </View>
                <Text 
                  style={[styles.statValue, { color: colors.text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {stat.value}
                </Text>
                <Text 
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {stat.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Weekly Activity Chart */}
        <View style={styles.section}>
          <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
            <View style={styles.chartHeader}>
              <BarChart3 size={getIconSize(20)} color={colors.primary} />
              <Text style={[styles.chartTitle, { color: colors.text }]}>{t('insights.weeklyActivity')}</Text>
            </View>
            
            <View style={styles.chart}>
              {weeklyData.map((item, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: `${(item.value / maxValue) * 100}%`,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('insights.categoryBreakdown')}</Text>
            
            {categories.map((category, index) => (
              <View key={index} style={styles.categoryRow}>
                <View style={styles.categoryLeft}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                  <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>{category.count} Resolves</Text>
                </View>
                <View style={[styles.categoryBarContainer, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.categoryBar, 
                      { 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color 
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Best Productivity Times */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeaderRow}>
              <Clock size={getIconSize(20)} color="#FFD88A" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('insights.bestProductivityTimes')}</Text>
            </View>
            
            {productivityTimes.map((time, index) => (
              <View key={index} style={styles.timeRow}>
                <View style={styles.timeLeft}>
                  <Text style={[styles.timeText, { color: colors.text }]}>{time.time}</Text>
                  <Text style={[styles.timePercentage, { color: colors.textSecondary }]}>{time.percentage}%</Text>
                </View>
                <View style={[styles.timeBarContainer, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.timeBar, 
                      { 
                        width: `${time.percentage}%`,
                        backgroundColor: time.color 
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Consistency Score */}
        <View style={styles.section}>
          <View style={styles.consistencyCard}>
            <View style={styles.consistencyLeft}>
              <Text style={styles.consistencyTitle}>{t('insights.consistencyScore')}</Text>
              <Text style={styles.consistencyScore}>{consistencyScore}</Text>
              <Text style={styles.consistencyText}>{t('insights.excellentKeepItUp')}</Text>
            </View>
            
            <View style={styles.consistencyRight}>
              <Svg width={rp(100)} height={rp(100)} viewBox="0 0 100 100">
                {/* Background circle */}
                <Circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255, 216, 138, 0.3)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <Circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#FFD88A"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(consistencyScore / 100) * 251.2} 251.2`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </Svg>
            </View>
          </View>
        </View>

        {/* AI Insights Coming Soon */}
        <View style={styles.section}>
          <View style={[styles.aiCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.aiEmoji}>🤖</Text>
            <Text style={[styles.aiTitle, { color: colors.text }]}>{t('insights.aiInsightsComingSoon')}</Text>
            <Text style={[styles.aiText, { color: colors.textSecondary }]}>
              Get personalized suggestions and optimize your Resolve strategy with AI
            </Text>
            <TouchableOpacity style={styles.aiButton}>
              <Text style={styles.aiButtonText}>Join Waitlist</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
      
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: getSpacing(16),
    fontSize: rf(16),
  },
  header: {
    backgroundColor: '#9163F2',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: rp(16),
    left: rp(24),
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: rf(28),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: getSpacing(4),
  },
  headerSubtitle: {
    fontSize: rf(14),
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: rp(16),
    paddingTop: rp(12),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: getSpacing(16),
  },
  statCard: {
    borderRadius: rp(16),
    padding: rp(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: rp(48),
    height: rp(48),
    borderRadius: rp(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(12),
  },
  statValue: {
    fontSize: rf(28),
    fontWeight: 'bold',
    marginBottom: getSpacing(2),
  },
  statLabel: {
    fontSize: rf(12),
    textAlign: 'center',
  },
  section: {
    marginBottom: getSpacing(16),
  },
  card: {
    borderRadius: rp(16),
    padding: rp(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: rf(16),
    fontWeight: '600',
    marginBottom: getSpacing(16),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(12),
    marginBottom: getSpacing(16),
  },
  chartCard: {
    borderRadius: rp(16),
    padding: rp(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(12),
    marginBottom: getSpacing(16),
  },
  chartTitle: {
    fontSize: rf(18),
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: isSmallScreen ? 100 : 120,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: getSpacing(2),
  },
  barWrapper: {
    width: '100%',
    height: isSmallScreen ? 80 : 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: isSmallScreen ? '60%' : '70%',
    backgroundColor: '#9163F2',
    borderRadius: rp(6),
    minHeight: rp(8),
  },
  barLabel: {
    fontSize: rf(12),
    color: '#666',
    marginTop: getSpacing(8),
  },
  categoryRow: {
    marginBottom: getSpacing(20),
  },
  categoryLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(8),
  },
  categoryName: {
    fontSize: rf(15),
    fontWeight: '500',
    flex: 1,
  },
  categoryCount: {
    fontSize: rf(14),
    marginLeft: getSpacing(8),
  },
  categoryBarContainer: {
    height: rp(8),
    backgroundColor: '#F0F0F0',
    borderRadius: rp(4),
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: rp(4),
  },
  timeRow: {
    marginBottom: getSpacing(12),
  },
  timeLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(8),
  },
  timeText: {
    fontSize: rf(14),
    flex: 1,
  },
  timePercentage: {
    fontSize: rf(14),
    fontWeight: '600',
    marginLeft: getSpacing(8),
  },
  timeBarContainer: {
    height: rp(8),
    backgroundColor: '#F0F0F0',
    borderRadius: rp(4),
    overflow: 'hidden',
  },
  timeBar: {
    height: '100%',
    borderRadius: rp(4),
  },
  consistencyCard: {
    backgroundColor: '#9163F2',
    borderRadius: rp(16),
    padding: rp(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  consistencyLeft: {
    flex: 1,
    minWidth: 0,
  },
  consistencyTitle: {
    fontSize: rf(16),
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: getSpacing(8),
  },
  consistencyScore: {
    fontSize: rf(56),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: getSpacing(8),
  },
  consistencyText: {
    fontSize: rf(15),
    color: 'rgba(255, 255, 255, 0.9)',
  },
  consistencyRight: {
    marginLeft: getSpacing(16),
  },
  aiCard: {
    borderRadius: rp(16),
    padding: rp(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aiEmoji: {
    fontSize: rf(40),
    marginBottom: getSpacing(12),
  },
  aiTitle: {
    fontSize: rf(18),
    fontWeight: '600',
    marginBottom: getSpacing(8),
    textAlign: 'center',
  },
  aiText: {
    fontSize: rf(14),
    textAlign: 'center',
    lineHeight: rf(20),
    marginBottom: getSpacing(16),
  },
  aiButton: {
    backgroundColor: '#9163F2',
    paddingVertical: rp(14),
    paddingHorizontal: rp(32),
    borderRadius: rp(25),
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: rf(16),
    fontWeight: '600',
  },
});
