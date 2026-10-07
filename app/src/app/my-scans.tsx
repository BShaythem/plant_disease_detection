import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';
import { ScanResult } from '../types';
import { getScanHistory } from '../utils/historyStorage';

export default function MyScansScreen() {
  const [scans, setScans] = useState<ScanResult[]>([]);

  useEffect(() => {
    getScanHistory().then((data) => setScans(data));
  }, []);

  const totalScans = scans.length;
  const healthyScans = scans.filter((s) => s.status === 'healthy').length;
  const healthyPercentage = totalScans > 0 ? Math.round((healthyScans / totalScans) * 100) : 0;

  // Breakdown by disease
  const diseaseCounts: Record<string, number> = {};
  scans.forEach((s) => {
    diseaseCounts[s.diseaseName] = (diseaseCounts[s.diseaseName] || 0) + 1;
  });

  const diseaseBreakdown = Object.entries(diseaseCounts).map(([name, count]) => ({
    name,
    count,
    percentage: totalScans > 0 ? Math.round((count / totalScans) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const mostFrequentDisease =
    diseaseBreakdown.filter((d) => !d.name.toLowerCase().includes('healthy'))[0]?.name ||
    (diseaseBreakdown[0]?.name ?? 'None');

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Scans & Analytics</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push('/(tabs)/history')}
        >
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <LinearGradient
          colors={colors.gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroBadge}>ORCHARD PATHOLOGY SUMMARY</Text>
          <Text style={styles.heroTitle}>Phytosanitary Metrics</Text>

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiValue}>{totalScans}</Text>
              <Text style={styles.kpiLabel}>Total Scans</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiValue, { color: '#86EFAC' }]}>{healthyPercentage}%</Text>
              <Text style={styles.kpiLabel}>Healthy Ratio</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiValue, { color: colors.goldLight }]}>
                {scans.length - healthyScans}
              </Text>
              <Text style={styles.kpiLabel}>Detected Risks</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Highlight Card: Most Frequent Condition */}
        <View style={styles.highlightCard}>
          <View style={styles.highlightIcon}>
            <MaterialCommunityIcons name="alert-decagram" size={24} color={colors.warning} />
          </View>
          <View style={styles.highlightContent}>
            <Text style={styles.highlightLabel}>Primary Pathogen Detected</Text>
            <Text style={styles.highlightValue}>{mostFrequentDisease}</Text>
            <Text style={styles.highlightSubtext}>
              Most frequent observation in recent field checks. Maintain scheduled preventative copper spray.
            </Text>
          </View>
        </View>

        {/* Breakdown by Disease */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Breakdown by Pathology Condition</Text>
          <Text style={styles.sectionSubtitle}>
            Distribution across all recorded olive foliage detections
          </Text>

          <View style={styles.diseaseList}>
            {diseaseBreakdown.map((item, idx) => (
              <View key={idx} style={styles.diseaseRow}>
                <View style={styles.diseaseInfoRow}>
                  <Text style={styles.diseaseName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.diseaseCount}>
                    {item.count} {item.count === 1 ? 'scan' : 'scans'} ({item.percentage}%)
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: item.name.toLowerCase().includes('healthy')
                          ? '#166534'
                          : colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Activity Overview */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Monthly Diagnostic Activity</Text>
          <View style={styles.timelineBox}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineMonth}>October 2026</Text>
                <Text style={styles.timelineDetails}>
                  4 scans recorded • 3 Peacock Spot alerts • 1 Healthy foliage
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.oliveSage }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineMonth}>September 2026</Text>
                <Text style={styles.timelineDetails}>
                  2 scans recorded • 1 Chlorosis check • 1 Healthy foliage
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.fullHistoryBtn}
          onPress={() => router.push('/(tabs)/history')}
          activeOpacity={0.85}
        >
          <Ionicons name="folder-open-outline" size={18} color="#FFFFFF" />
          <Text style={styles.fullHistoryBtnText}>View Full Scan Records in History</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.oliveSoftBg,
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: borderRadius.md,
    paddingVertical: 14,
  },
  kpiBox: {
    alignItems: 'center',
    flex: 1,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.olivePale,
    fontWeight: '500',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 130, 43, 0.25)',
    gap: 12,
    ...shadows.soft,
  },
  highlightIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.sm,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightContent: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  highlightSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  diseaseList: {
    gap: 12,
  },
  diseaseRow: {
    gap: 4,
  },
  diseaseInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diseaseName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  diseaseCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.olivePale,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  timelineBox: {
    marginTop: spacing.sm,
    gap: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineMonth: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timelineDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fullHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  fullHistoryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
