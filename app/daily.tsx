import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Animated, RefreshControl, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Clock, CheckCircle2, Circle } from 'lucide-react-native';
import { useHabits, useHabitSchedules } from '../src/hooks/useHabits';
import { HabitService } from '../src/services/habit.service';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { translateResolveName } from '../src/utils/translations';
import BottomTabBar from '../src/components/BottomTabBar';

export default function DailyScreen() {
  const router = useRouter();
  const { habits, loading, refetch } = useHabits();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  // Get translated day names
  const DAY_NAMES = [
    t('dateTime.sunday'),
    t('dateTime.monday'),
    t('dateTime.tuesday'),
    t('dateTime.wednesday'),
    t('dateTime.thursday'),
    t('dateTime.friday'),
    t('dateTime.saturday'),
  ];
  const DAY_SHORT = [
    t('dateTime.sunday').substring(0, 3),
    t('dateTime.monday').substring(0, 3),
    t('dateTime.tuesday').substring(0, 3),
    t('dateTime.wednesday').substring(0, 3),
    t('dateTime.thursday').substring(0, 3),
    t('dateTime.friday').substring(0, 3),
    t('dateTime.saturday').substring(0, 3),
  ];
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [completedHabits, setCompletedHabits] = useState<any[]>([]);
  const [loadingCompleted, setLoadingCompleted] = useState(true);

  // Animated values for collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 140;
  const HEADER_MIN_HEIGHT = 70;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

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

  const titleFontSize = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [28, 20],
    extrapolate: 'clamp',
  });

  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const [stats, setStats] = React.useState({
    dailyProgress: 0,
    streak: 0,
    activeHabits: 0,
    completedToday: 0,
  });

  // Load today's completions and calculate stats
  // Load completed habits
  React.useEffect(() => {
    const loadCompletedHabits = async () => {
      try {
        setLoadingCompleted(true);
        const completed = await HabitService.getCompletedHabits();
        setCompletedHabits(completed);
      } catch (error) {
        console.error('Error loading completed habits:', error);
      } finally {
        setLoadingCompleted(false);
      }
    };
    loadCompletedHabits();
  }, []);

  React.useEffect(() => {
    const loadCompletions = async () => {
      const completed = new Set<string>();
      let totalScheduled = 0;
      let completedCount = 0;
      
      for (const habit of habits) {
        try {
          // Get schedules for today
          const schedules = await HabitService.getHabitSchedules(habit.id);
          const todaySchedules = schedules.filter(s => s.day_of_week === currentDay && s.enabled);
          totalScheduled += todaySchedules.length;
          
          // Check if completed
          const completions = await HabitService.getHabitCompletions(habit.id, todayDateString, todayDateString);
          if (completions.length > 0) {
            completed.add(habit.id);
            completedCount += todaySchedules.length;
          }
        } catch (error) {
          console.error('Error loading completions:', error);
        }
      }
      
      setCompletedToday(completed);
      
      // Calculate daily progress
      const dailyProgress = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;
      
      // Calculate streak (consecutive days with at least one completion)
      let streak = 0;
      try {
        const allCompletions: Set<string> = new Set();
        for (const habit of habits) {
          const weekCompletions = await HabitService.getHabitCompletions(
            habit.id,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            todayDateString
          );
          weekCompletions.forEach(c => allCompletions.add(c.completion_date));
        }
        
        const completionDates = Array.from(allCompletions).sort().reverse();
        let checkDate = new Date(today);
        checkDate.setHours(0, 0, 0, 0);
        
        for (const dateStr of completionDates) {
          const date = new Date(dateStr);
          date.setHours(0, 0, 0, 0);
          if (date.getTime() === checkDate.getTime()) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (date.getTime() < checkDate.getTime()) {
            break;
          }
        }
      } catch (error) {
        console.error('Error calculating streak:', error);
      }
      
      setStats({
        dailyProgress,
        streak,
        activeHabits: habits.length,
        completedToday: completedCount,
      });
    };

    if (habits.length > 0) {
      loadCompletions();
    } else {
      setStats({
        dailyProgress: 0,
        streak: 0,
        activeHabits: 0,
        completedToday: 0,
      });
    }
  }, [habits, todayDateString, currentDay]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    // Reload completed habits
    try {
      const completed = await HabitService.getCompletedHabits();
      setCompletedHabits(completed);
    } catch (error) {
      console.error('Error loading completed habits:', error);
    }
    setRefreshing(false);
  };

  const handleToggleComplete = async (habitId: string) => {
    const isCompleted = completedToday.has(habitId);
    
    try {
      if (isCompleted) {
        await HabitService.uncompleteHabit(habitId, todayDateString);
        setCompletedToday(prev => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
      } else {
        await HabitService.completeHabit(habitId, todayDateString);
        setCompletedToday(prev => new Set(prev).add(habitId));
        // Notification is sent automatically by HabitService.completeHabit
      }
    } catch (error: any) {
      console.error('Error toggling completion:', error);
      Alert.alert(t('common.error'), error.message || t('habit.failedToUpdate'));
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? t('dateTime.pm') : t('dateTime.am');
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const monthNames = [
      t('dateTime.january'),
      t('dateTime.february'),
      t('dateTime.march'),
      t('dateTime.april'),
      t('dateTime.may'),
      t('dateTime.june'),
      t('dateTime.july'),
      t('dateTime.august'),
      t('dateTime.september'),
      t('dateTime.october'),
      t('dateTime.november'),
      t('dateTime.december'),
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const getTodaySchedules = async (habitId: string) => {
    try {
      const schedules = await HabitService.getHabitSchedules(habitId);
      return schedules.filter(s => s.day_of_week === currentDay && s.enabled);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      return [];
    }
  };

  if (loading && habits.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('daily.loadingHabits')}</Text>
        </View>
        <BottomTabBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            height: headerHeight,
            paddingHorizontal: headerPadding,
            paddingTop: headerPadding,
            paddingBottom: headerPadding,
            backgroundColor: colors.primary,
          }
        ]}
      >
        <Animated.Text 
          style={[
            styles.headerTitle,
            { fontSize: titleFontSize, color: '#FFFFFF' }
          ]}
        >
          {t('daily.title')}
        </Animated.Text>
        <Text style={[styles.headerSubtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
          {DAY_NAMES[currentDay]}, {formatDate(today)}
        </Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats Section - Carousel */}
        {habits.length > 0 && (
          <View style={styles.statsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="normal"
              contentContainerStyle={styles.statsCarousel}
              style={styles.statsScrollView}
            >
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FFD88A20' }]}>
                  <Text style={styles.statIcon}>📊</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.dailyProgress}%</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('daily.dailyProgress')}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FF6A6A20' }]}>
                  <Text style={styles.statIcon}>🔥</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.streak}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('daily.dayStreak')}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#9163F220' }]}>
                  <Text style={styles.statIcon}>🎯</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeHabits}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('daily.activeHabits')}</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#96E6B320' }]}>
                  <Text style={styles.statIcon}>✓</Text>
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.completedToday}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('daily.completed')}</Text>
              </View>
            </ScrollView>
          </View>
        )}

        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('daily.noHabitsYet')}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('daily.createFirstHabit')}
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/create-choice')}
            >
              <Text style={styles.createButtonText}>{t('daily.createHabit')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Active Habits Section */}
            {habits.filter(h => !completedToday.has(h.id)).length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('daily.activeHabitsSection')}</Text>
                <View style={styles.habitsList}>
                  {habits
                    .filter(h => !completedToday.has(h.id))
                    .map((habit) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        isCompleted={false}
                        onToggleComplete={() => handleToggleComplete(habit.id)}
                        onPress={() => router.push(`/habit-detail?id=${habit.id}`)}
                        currentDay={currentDay}
                        colors={colors}
                      />
                    ))}
                </View>
              </View>
            )}

            {/* Completed Today Habits Section */}
            {habits.filter(h => completedToday.has(h.id)).length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('daily.completedToday')}</Text>
                <View style={styles.habitsList}>
                  {habits
                    .filter(h => completedToday.has(h.id))
                    .map((habit) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        isCompleted={true}
                        onToggleComplete={() => handleToggleComplete(habit.id)}
                        onPress={() => router.push(`/habit-detail?id=${habit.id}`)}
                        currentDay={currentDay}
                        colors={colors}
                      />
                    ))}
                </View>
              </View>
            )}

            {/* Completed Habits Section (Duration Reached) */}
            {completedHabits.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('daily.completedHabitsSection')}</Text>
                <View style={styles.habitsList}>
                  {completedHabits.map((habit) => (
                    <TouchableOpacity
                      key={habit.id}
                      style={[styles.completedHabitCard, { backgroundColor: colors.surface }]}
                      onPress={() => router.push(`/habit-detail?id=${habit.id}`)}
                    >
                      <View style={styles.completedHabitHeader}>
                        <Text style={[styles.completedHabitName, { color: colors.text }]}>{translateResolveName(habit.name)}</Text>
                        {habit.completion_rate !== null && habit.completion_rate !== undefined && (
                          <View style={[styles.completionRateBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.completionRateText, { color: colors.primary }]}>
                              {habit.completion_rate}%
                            </Text>
                          </View>
                        )}
                      </View>
                      {habit.description && (
                        <Text style={[styles.completedHabitDescription, { color: colors.textSecondary }]}>
                          {habit.description}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

interface HabitCardProps {
  habit: any;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onPress: () => void;
  currentDay: number;
  colors: any;
}

function HabitCard({ habit, isCompleted, onToggleComplete, onPress, currentDay, colors }: HabitCardProps) {
  const { t } = useLanguage();
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = React.useState(true);

  React.useEffect(() => {
    const loadSchedules = async () => {
      try {
        const data = await HabitService.getHabitSchedules(habit.id);
        const todaySchedules = data.filter(s => s.day_of_week === currentDay && s.enabled);
        setSchedules(todaySchedules);
      } catch (error) {
        console.error('Error loading schedules:', error);
      } finally {
        setLoadingSchedules(false);
      }
    };
    loadSchedules();
  }, [habit.id, currentDay]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? t('dateTime.pm') : t('dateTime.am');
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Show habit even if no schedule for today, but indicate it
  const hasScheduleForToday = schedules.length > 0;

  return (
    <TouchableOpacity
      style={[styles.habitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={styles.habitHeader}
        onPress={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        activeOpacity={0.7}
      >
        {isCompleted ? (
          <CheckCircle2 size={28} color={colors.primary} />
        ) : (
          <Circle size={28} color={colors.textSecondary} />
        )}
        <View style={styles.habitInfo}>
          <Text style={[styles.habitName, { color: colors.text }]}>{translateResolveName(habit.name)}</Text>
          {habit.description && (
            <Text style={[styles.habitDescription, { color: colors.textSecondary }]} numberOfLines={1}>
              {habit.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {hasScheduleForToday ? (
        <View style={styles.schedulesContainer}>
          {schedules.map((schedule, index) => (
            <View key={index} style={[styles.scheduleItem, { backgroundColor: colors.background }]}>
              <Clock size={16} color={colors.primary} />
              <Text style={[styles.scheduleTime, { color: colors.text }]}>
                {formatTime(schedule.time)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noScheduleContainer}>
          <Text style={[styles.noScheduleText, { color: colors.textSecondary }]}>
            {t('daily.noScheduleToday')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
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
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 160,
    padding: 20,
  },
  statsWrapper: {
    marginBottom: 24,
  },
  statsScrollView: {
    flexGrow: 0,
  },
  statsCarousel: {
    paddingHorizontal: 20,
  },
  statCard: {
    width: Math.max(100, (Dimensions.get('window').width - 76) / 3.3), // 3 full cards + partial 4th preview (20px padding each side + 36px for 3 gaps)
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginRight: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  noScheduleContainer: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
  },
  noScheduleText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  habitsList: {
    gap: 16,
  },
  habitCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
  },
  schedulesContainer: {
    marginTop: 12,
    gap: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  completedHabitCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completedHabitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completedHabitName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  completionRateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completionRateText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedHabitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
