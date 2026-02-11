import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useResolves } from '../src/hooks/useResolves';
import { ExportService, type PaktExportData } from '../src/services/export.service';
import { translateCategory, translateResolveName } from '../src/utils/translations';
import BottomTabBar from '../src/components/BottomTabBar';

export default function ExportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { resolves: Resolves, loading: paktsLoading } = useResolves();
  const [selectedPakts, setSelectedPakts] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const togglePaktSelection = (paktId: string) => {
    const newSelected = new Set(selectedPakts);
    if (newSelected.has(paktId)) {
      newSelected.delete(paktId);
    } else {
      newSelected.add(paktId);
    }
    setSelectedPakts(newSelected);
  };

  const selectAll = () => {
    if (selectedPakts.size === Resolves.length) {
      setSelectedPakts(new Set());
    } else {
      setSelectedPakts(new Set(Resolves.map(p => p.id)));
    }
  };

  const handleExportSelected = async () => {
    if (selectedPakts.size === 0) {
      Alert.alert(t('export.noSelection'), t('export.selectAtLeastOne'));
      return;
    }

    try {
      setExporting(true);
      
      const paktsToExport: PaktExportData[] = Resolves
        .filter(p => selectedPakts.has(p.id))
        .map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          category: p.category,
          deadline: p.deadline,
          progress: p.progress || 0,
          status: p.status,
          milestones: p.milestones?.map(m => ({
            name: m.name,
            due_date: m.due_date,
            completed: m.completed,
            notes: m.notes || undefined,
          })),
        }));

      if (paktsToExport.length === 1) {
        await ExportService.exportPaktToPDF(paktsToExport[0]);
      } else {
        await ExportService.exportPaktsToPDF(paktsToExport);
      }

      Alert.alert('Success', t('export.exported'));
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Error', 'Failed to export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (paktsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('export.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <FileText size={24} color={colors.primary} />
          <Text style={[styles.infoTitle, { color: colors.text }]}>{t('export.selectPakts')}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('export.exportDescription')}
          </Text>
        </View>

        {/* Select All */}
        {Resolves.length > 0 && (
          <TouchableOpacity
            style={[styles.selectAllButton, { backgroundColor: colors.surface }]}
            onPress={selectAll}
          >
            <Text style={[styles.selectAllText, { color: colors.primary }]}>
              {selectedPakts.size === Resolves.length ? t('export.deselectAll') : t('export.selectAll')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Resolve List */}
        {Resolves.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('export.noPaktsToExport')}
            </Text>
          </View>
        ) : (
          <View style={styles.paktsList}>
            {Resolves.map((resolve) => {
              const isSelected = selectedPakts.has(resolve.id);
              return (
                <TouchableOpacity
                  key={resolve.id}
                  style={[
                    styles.paktCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => togglePaktSelection(resolve.id)}
                >
                  <View style={styles.paktLeft}>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      {isSelected && <CheckCircle size={20} color="#FFFFFF" />}
                    </View>
                    <View style={styles.paktInfo}>
                      <Text style={[styles.paktName, { color: colors.text }]}>{translateResolveName(resolve.name)}</Text>
                      <Text style={[styles.paktDetails, { color: colors.textSecondary }]}>
                        {translateCategory(resolve.category)} • {resolve.progress}% {t('common.complete') || 'complete'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Export Button */}
      {selectedPakts.size > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.primary }]}
            onPress={handleExportSelected}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <FileText size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>
                  {t('export.exportPakt')} ({selectedPakts.size})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
  selectAllButton: {
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
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
    borderWidth: 1,
  },
  paktLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  footer: {
    padding: 24,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
