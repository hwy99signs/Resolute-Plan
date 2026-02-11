import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { useResolves } from '../src/hooks/useResolves';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { translateCategory, translateResolveName } from '../src/utils/translations';

export default function AllPaktsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { resolves, loading } = useResolves();

  // Filter active resolves
  const activeResolves = resolves.filter(p => p.status === 'active');

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
    // Use database progress if available, otherwise calculate from milestones
    if (resolve.progress !== undefined && resolve.progress !== null) {
      return resolve.progress;
    }
    const milestones = (resolve as any).milestones;
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter((m: any) => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('allPakts.loadingPakts')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('allPakts.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {activeResolves.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('allPakts.noActivePakts')}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('allPakts.createFirstPakt')}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/category-selection')}
            >
              <Text style={styles.createButtonText}>{t('allPakts.createFirstPaktButton')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.paktsList}>
            {activeResolves.map((resolve) => {
              const progress = getPaktProgress(resolve);
              const icon = getCategoryIcon(resolve.category || '');
              const color = getCategoryColor(resolve.category || '');
              const milestones = (resolve as any).milestones || [];
              const completedMilestones = milestones.filter((m: any) => m.completed).length || 0;
              const totalMilestones = milestones.length || 0;
              const dueDate = getDueDateText(resolve.deadline);

              return (
                <TouchableOpacity 
                  key={resolve.id} 
                  style={[styles.paktCard, { backgroundColor: colors.surface }]}
                  onPress={() => router.push(`/pakt-detail?id=${resolve.id}`)}
                >
                  <View style={styles.paktHeader}>
                    <View style={[styles.paktIcon, { backgroundColor: color }]}>
                      <Text style={styles.paktIconText}>{icon}</Text>
                    </View>
                    <View style={styles.paktInfo}>
                      <Text style={[styles.paktName, { color: colors.text }]}>{translateResolveName(resolve.name)}</Text>
                      <Text style={[styles.paktCategory, { color: colors.textSecondary }]}>{translateCategory(resolve.category)}</Text>
                    </View>
                    <View style={styles.paktProgress}>
                      <Text style={[styles.progressValue, { color: colors.primary }]}>{progress}%</Text>
                    </View>
                  </View>

                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${progress}%`, backgroundColor: color }
                      ]} 
                    />
                  </View>

                  <View style={styles.paktFooter}>
                    <Text style={[styles.paktMilestones, { color: colors.textSecondary }]}>
                      {completedMilestones}/{totalMilestones} {t('dashboard.milestones')}
                    </Text>
                    <Text style={[styles.paktDue, { color: colors.primary }]}>{t('dashboard.dueIn')} {dueDate}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
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
  paktsList: {
    gap: 12,
  },
  paktCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
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
});
