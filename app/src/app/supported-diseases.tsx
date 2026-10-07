import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';
import { MOCK_DISEASES } from '../utils/mockData';
import { LeafImage } from '../components/LeafImage';

export default function SupportedDiseasesScreen() {
  const sampleKeys = ['sample1', 'sample2', 'sample3', 'sample4', 'sample5', 'sample6'];

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Pathogen Catalog</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Diagnosable Olive Conditions</Text>
          <Text style={styles.introText}>
            Olive Care’s vision engine is trained on Mediterranean orchard datasets to identify specific
            foliar lesions, bacterial knots, vascular wilting, and nutrient imbalances.
          </Text>
        </View>

        {MOCK_DISEASES.map((disease, idx) => (
          <View key={idx} style={styles.diseaseCard}>
            <View style={styles.imageBox}>
              <LeafImage uri={sampleKeys[idx] || 'sample1'} style={styles.cardImage} resizeMode="cover" />
              <View
                style={[
                  styles.statusBadge,
                  disease.status === 'healthy' ? styles.badgeHealthy : styles.badgeInfected,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    disease.status === 'healthy' ? styles.badgeHealthyText : styles.badgeInfectedText,
                  ]}
                >
                  {disease.status === 'healthy' ? 'Healthy Benchmark' : `${disease.severity} Severity`}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.diseaseName}>{disease.diseaseName}</Text>
              <Text style={styles.scientificName}>{disease.scientificName}</Text>
              <Text style={styles.description}>{disease.description}</Text>

              <Text style={styles.subHeading}>Visual Symptoms:</Text>
              {disease.symptoms.map((sym, sIdx) => (
                <View key={sIdx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{sym}</Text>
                </View>
              ))}

              <Text style={styles.subHeading}>Key Cultural Management:</Text>
              {disease.recommendedTreatments.slice(0, 2).map((tr, tIdx) => (
                <View key={tIdx} style={styles.bulletRow}>
                  <Ionicons name="shield-checkmark" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>{tr}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
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
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  introText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  diseaseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  imageBox: {
    position: 'relative',
    height: 160,
    width: '100%',
    backgroundColor: colors.olivePale,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    ...shadows.soft,
  },
  badgeHealthy: {
    backgroundColor: '#DCFCE7',
  },
  badgeInfected: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeHealthyText: {
    color: '#166534',
  },
  badgeInfectedText: {
    color: '#991B1B',
  },
  cardBody: {
    padding: spacing.md,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 8,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  bulletDot: {
    fontSize: 16,
    color: colors.primary,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});
