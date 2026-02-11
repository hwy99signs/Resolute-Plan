import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useResolves } from '../src/hooks/useResolves';
import { ShareService } from '../src/services/share.service';
import { translateCategory, translateResolveName } from '../src/utils/translations';
import BottomTabBar from '../src/components/BottomTabBar';

export default function ShareScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { resolves: Resolves } = useResolves();

  const handleSharePakt = async (resolve: any) => {
    try {
      await ShareService.sharePakt({
        name: resolve.name,
        description: resolve.description || '',
        category: resolve.category,
        progress: resolve.progress || 0,
        milestones: resolve.milestones?.map((m: any) => ({
          name: m.name,
          completed: m.completed,
        })),
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('share.sharePakt')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Share2 size={24} color={colors.primary} />
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            {t('share.shareYourResolutions')}
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('share.shareDescription')}
          </Text>
        </View>

        {Resolves.length === 0 ? (
          <View style={styles.emptyState}>
            <Share2 size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('share.noPaktsToShare')}
            </Text>
          </View>
        ) : (
          <View style={styles.paktsList}>
            {Resolves.map((resolve) => (
              <TouchableOpacity
                key={resolve.id}
                style={[styles.paktCard, { backgroundColor: colors.surface }]}
                onPress={() => handleSharePakt(resolve)}
              >
                <View style={styles.paktInfo}>
                  <Text style={[styles.paktName, { color: colors.text }]}>{translateResolveName(resolve.name)}</Text>
                  <Text style={[styles.paktDetails, { color: colors.textSecondary }]}>
                    {translateCategory(resolve.category)} • {resolve.progress}% {t('common.complete') || 'complete'}
                  </Text>
                </View>
                <Share2 size={24} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomTabBar />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    margin: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  paktsList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  paktCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paktInfo: {
    flex: 1,
  },
  paktName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paktDetails: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
