import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';
import { ScanResult } from '../../types';
import { getScanHistory, deleteScanResult, clearAllHistory } from '../../utils/historyStorage';
import { LeafImage } from '../../components/LeafImage';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'infected' | 'healthy'>('all');

  const loadHistory = async () => {
    const data = await getScanHistory();
    setHistory(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Detection Record',
      `Are you sure you want to remove the record for "${name}"? This will permanently delete the saved photo.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteScanResult(id);
            await loadHistory();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      'This will delete all saved olive leaf diagnostic scans. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllHistory();
            await loadHistory();
          },
        },
      ]
    );
  };

  const filteredList = history.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const totalScans = history.length;
  const infectedCount = history.filter((i) => i.status === 'infected' || i.status === 'warning').length;
  const healthyCount = history.filter((i) => i.status === 'healthy').length;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={colors.gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerBadge}>ORCHARD ARCHIVE</Text>
              <Text style={styles.headerTitle}>Diagnostic History</Text>
            </View>
            {history.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearAll}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={18} color="#FFFFFFCC" />
              </TouchableOpacity>
            )}
          </View>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalScans}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#FCA5A5' }]}>{infectedCount}</Text>
              <Text style={styles.statLabel}>Pathogens</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#86EFAC' }]}>{healthyCount}</Text>
              <Text style={styles.statLabel}>Healthy</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Filters */}
        {totalScans > 0 && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All ({totalScans})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'infected' && styles.filterChipActive]}
              onPress={() => setFilter('infected')}
            >
              <Text style={[styles.filterText, filter === 'infected' && styles.filterTextActive]}>
                Pathogens ({infectedCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'healthy' && styles.filterChipActive]}
              onPress={() => setFilter('healthy')}
            >
              <Text style={[styles.filterText, filter === 'healthy' && styles.filterTextActive]}>
                Healthy ({healthyCount})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History List */}
        <View style={styles.listContainer}>
          {filteredList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons name="leaf-off" size={42} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No detections yet</Text>
              <Text style={styles.emptyDesc}>
                Take or import leaf photos from the Home tab to analyze tree health and build your orchard history.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push('/(tabs)/home')}
                activeOpacity={0.85}
              >
                <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                <Text style={styles.emptyActionBtnText}>Go to Home & Scan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredList.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/history-detail', params: { id: item.id } })}
                activeOpacity={0.85}
              >
                {/* Real leaf thumbnail with fallback support */}
                <LeafImage uri={item.imageUri} style={styles.thumb} resizeMode="cover" />

                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.diseaseName}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        item.status === 'healthy' ? styles.badgeHealthy : styles.badgeInfected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          item.status === 'healthy'
                            ? styles.badgeHealthyText
                            : styles.badgeInfectedText,
                        ]}
                      >
                        {item.status === 'healthy' ? 'Healthy' : `${item.confidence}%`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardScientific} numberOfLines={1}>
                    {item.scientificName}
                  </Text>

                  {item.userNote ? (
                    <Text style={styles.cardNotePreview} numberOfLines={1}>
                      Note: {item.userNote}
                    </Text>
                  ) : null}

                  <View style={styles.cardBottomRow}>
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.diseaseName);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.deleteIconButton}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    marginTop: 4,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: colors.olivePale,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: borderRadius.md,
    ...shadows.soft,
  },
  emptyActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
    alignItems: 'center',
  },
  thumb: {
    width: 78,
    height: 78,
    borderRadius: borderRadius.md,
    backgroundColor: colors.olivePale,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeHealthy: {
    backgroundColor: '#DCFCE7',
  },
  badgeInfected: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeHealthyText: {
    color: '#166534',
  },
  badgeInfectedText: {
    color: '#991B1B',
  },
  cardScientific: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardNotePreview: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  deleteIconButton: {
    padding: 4,
  },
});
