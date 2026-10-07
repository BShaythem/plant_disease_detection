import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';

export default function DiagnosticSettingsScreen() {
  const [highResCapture, setHighResCapture] = useState(true);
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [offlineModel, setOfflineModel] = useState(true);
  const [sporeAlerts, setSporeAlerts] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState('85% (Recommended)');

  const handleResetCache = () => {
    Alert.alert(
      'Reset Detection Cache',
      'This will clear local thumbnail buffers and reload offline pathology weights.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            Alert.alert('Completed', 'Detection cache restored to default.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Diagnostic Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Image Processing</Text>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>High-Resolution Leaf Capture</Text>
              <Text style={styles.rowDesc}>
                Maintains fine micro-halo and lesion detail in leaf scans (uses 90% JPEG quality)
              </Text>
            </View>
            <Switch
              value={highResCapture}
              onValueChange={setHighResCapture}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor={Platform.OS === 'android' ? colors.gold : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Auto-Save Scans to History</Text>
              <Text style={styles.rowDesc}>
                Persist new detections into the app database immediately upon completion
              </Text>
            </View>
            <Switch
              value={autoSaveHistory}
              onValueChange={setAutoSaveHistory}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor={Platform.OS === 'android' ? colors.gold : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>AI Pathogen Engine</Text>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Offline Mobile Inference</Text>
              <Text style={styles.rowDesc}>
                Run diagnostic models entirely on-device without internet coverage in orchards
              </Text>
            </View>
            <Switch
              value={offlineModel}
              onValueChange={setOfflineModel}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor={Platform.OS === 'android' ? colors.gold : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Phytosanitary Spore Alerts</Text>
              <Text style={styles.rowDesc}>
                Notify when local humidity and temperature indicate high Spilocaea germination risk
              </Text>
            </View>
            <Switch
              value={sporeAlerts}
              onValueChange={setSporeAlerts}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor={Platform.OS === 'android' ? colors.gold : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Maintenance & Storage</Text>
          <TouchableOpacity style={styles.actionRow} onPress={handleResetCache} activeOpacity={0.8}>
            <View style={styles.actionIconBox}>
              <Ionicons name="refresh" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Clear Local Image Cache</Text>
              <Text style={styles.actionDesc}>Free cached preview bitmaps while preserving scan history</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
