import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../../constants/theme';
import { getScanHistory } from '../../utils/historyStorage';
import { ScanResult } from '../../types';
import { LeafImage } from '../../components/LeafImage';

export default function HomeScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  useFocusEffect(
    useCallback(() => {
      getScanHistory().then((data) => setRecentScans(data.slice(0, 3)));
    }, [])
  );

  const handleTakePhoto = async () => {
    try {
      setIsProcessing(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Olive Care requires access to your camera to capture and analyze olive tree leaf photos.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        router.push({
          pathname: '/scanner',
          params: { imageUri, source: 'camera' },
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      setIsProcessing(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Gallery Permission Required',
          'Olive Care requires photo library access to select leaf images for diagnostic scan.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        router.push({
          pathname: '/scanner',
          params: { imageUri, source: 'gallery' },
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Unable to pick image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Green Gradient Header */}
        <LinearGradient
          colors={colors.gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <MaterialCommunityIcons name="leaf" size={26} color={colors.gold} />
              </View>
              <View>
                <Text style={styles.appName}>Olive Care</Text>
                <Text style={styles.appTagline}>Olive Foliage Pathogen Diagnostics</Text>
              </View>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusPillText}>AI Engine Ready</Text>
            </View>
          </View>

          <View style={styles.headerBanner}>
            <Text style={styles.bannerHeadline}>
              Protect Your Orchard with Instant Leaf Vision
            </Text>
            <Text style={styles.bannerSubtext}>
              Spot Peacock Spot, Cercospora & Anthracnose before fungal spores spread across your grove.
            </Text>
          </View>
        </LinearGradient>

        {/* Primary Action Card */}
        <View style={styles.mainCardContainer}>
          <View style={styles.diagnosticCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBox}>
                <MaterialCommunityIcons name="shield-search" size={24} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Leaf Health Scanner</Text>
                <Text style={styles.cardSubtitle}>
                  Provide an olive leaf photo to begin instant inspection
                </Text>
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              {/* Take a Photo Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.primaryBtn]}
                onPress={handleTakePhoto}
                activeOpacity={0.85}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  <View style={styles.btnIconCircle}>
                    <Ionicons name="camera" size={22} color={colors.gold} />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnTextLight}>Take a photo</Text>
                    <Text style={styles.btnSubtextLight}>Use camera in orchard</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#FFFFFF88" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Import from Gallery Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.secondaryBtn]}
                onPress={handlePickFromGallery}
                activeOpacity={0.85}
                disabled={isProcessing}
              >
                <View style={styles.secondaryBtnContent}>
                  <View style={[styles.btnIconCircle, styles.galleryIconCircle]}>
                    <Ionicons name="images" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnTextDark}>Import from gallery</Text>
                    <Text style={styles.btnSubtextDark}>Choose saved leaf image</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick helper note */}
            <View style={styles.securityRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primaryLight} />
              <Text style={styles.securityText}>
                No cloud upload required • High precision olive dataset
              </Text>
            </View>
          </View>
        </View>

        {/* Photography Guidelines Card */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionHeader}>Photography Guidelines</Text>
          <View style={styles.guidelinesCard}>
            <View style={styles.guideItem}>
              <View style={styles.guideBadge}>
                <Ionicons name="sunny" size={18} color={colors.gold} />
              </View>
              <View style={styles.guideTextWrap}>
                <Text style={styles.guideTitle}>Natural Indirect Sunlight</Text>
                <Text style={styles.guideDesc}>
                  Avoid heavy glare or flash reflection on the waxy cuticle of the olive leaf.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.guideItem}>
              <View style={styles.guideBadge}>
                <MaterialCommunityIcons name="focus-field" size={18} color={colors.primary} />
              </View>
              <View style={styles.guideTextWrap}>
                <Text style={styles.guideTitle}>Single Leaf Close-Up</Text>
                <Text style={styles.guideDesc}>
                  Position the leaf 10–15 cm from lens so lesions or halos fill the frame.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.guideItem}>
              <View style={styles.guideBadge}>
                <Ionicons name="color-filter" size={18} color={colors.oliveSage} />
              </View>
              <View style={styles.guideTextWrap}>
                <Text style={styles.guideTitle}>Inspect Both Faces</Text>
                <Text style={styles.guideDesc}>
                  Peacock spots show on the upper face; Cercospora felt forms underneath.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Scans Shortcut */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Recent Scans</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.seeAllText}>View All History →</Text>
            </TouchableOpacity>
          </View>

          {recentScans.length === 0 ? (
            <View style={styles.recentItemCard}>
              <View style={[styles.recentThumb, { justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialCommunityIcons name="leaf" size={24} color={colors.primary} />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentTitle}>No scans recorded yet</Text>
                <Text style={styles.recentSciName}>Take a leaf photo above to start</Text>
              </View>
            </View>
          ) : (
            recentScans.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentItemCard}
                onPress={() => router.push({ pathname: '/history-detail', params: { id: item.id } })}
                activeOpacity={0.8}
              >
                <LeafImage uri={item.imageUri} style={styles.recentThumb} resizeMode="cover" />
                <View style={styles.recentInfo}>
                  <View style={styles.recentTopRow}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {item.diseaseName}
                    </Text>
                    <View
                      style={[
                        styles.statusTag,
                        item.status === 'healthy' ? styles.statusHealthy : styles.statusInfected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          item.status === 'healthy'
                            ? styles.statusHealthyText
                            : styles.statusInfectedText,
                        ]}
                      >
                        {item.status === 'healthy' ? 'Healthy' : `${item.confidence}% Match`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recentSciName}>{item.scientificName}</Text>
                  <Text style={styles.recentDate}>{item.date}</Text>
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
    paddingBottom: spacing.xl + 20,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 12,
    color: colors.olivePale,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6EE7B7',
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerBanner: {
    marginTop: spacing.sm,
  },
  bannerHeadline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 6,
  },
  bannerSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 18,
  },
  mainCardContainer: {
    paddingHorizontal: spacing.md,
    marginTop: -28,
  },
  diagnosticCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 12,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  buttonsContainer: {
    gap: 12,
    marginTop: 6,
  },
  actionBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  primaryBtn: {
    ...shadows.soft,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
  },
  btnIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  galleryIconCircle: {
    backgroundColor: colors.oliveSoftBg,
  },
  btnTextCol: {
    flex: 1,
  },
  btnTextLight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSubtextLight: {
    fontSize: 12,
    color: colors.olivePale,
    marginTop: 1,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  secondaryBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  btnTextDark: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  btnSubtextDark: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  securityText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionWrapper: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  guidelinesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guideBadge: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  guideTextWrap: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  guideDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  recentItemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
    alignItems: 'center',
  },
  recentThumb: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.olivePale,
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusInfected: {
    backgroundColor: '#FEE2E2',
  },
  statusHealthy: {
    backgroundColor: '#DCFCE7',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusInfectedText: {
    color: '#991B1B',
  },
  statusHealthyText: {
    color: '#166534',
  },
  recentSciName: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: 2,
  },
  recentDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
});
