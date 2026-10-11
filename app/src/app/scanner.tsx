import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../constants/theme';
import { ScanResult } from '../types';
import { MOCK_DISEASES } from '../utils/mockData';
import { saveScanResult } from '../utils/historyStorage';
import { LeafImage, SAMPLE_ASSETS } from '../components/LeafImage';
import { classifyOliveLeaf } from '../services/vision';
import { getDiseaseByLabel, getDiseaseDoc, createSession, saveImage, saveDiagnosis } from '../services/db';
import { Asset } from 'expo-asset';

export default function ScannerScreen() {
  const params = useLocalSearchParams<{ imageUri?: string; source?: string }>();
  const initialUri =
    params.imageUri || 'https://images.unsplash.com/photo-1541256942802-7b2996802bf1?w=800';

  const [imageUri, setImageUri] = useState<string>(initialUri);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanStep, setScanStep] = useState<string>('Analyzing leaf geometry...');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Animated laser scan line
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Run scan animation loop while scanning
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;

    if (isScanning) {
      scanLineAnim.setValue(0);
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 260,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();

      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    }

    return () => {
      animLoop?.stop();
      pulseLoop?.stop();
    };
  }, [isScanning]);

  // Execute diagnostic scan workflow with real ONNX Vision Inference
  const runDiagnosticScan = async (targetUri: string) => {
    setIsScanning(true);
    setScanResult(null);
    setIsSaved(false);

    setScanStep('Preprocessing leaf image (224x224 RGB)...');

    try {
      // 1. Resolve bundled sample asset if targetUri is a sample key
      let resolvedUri = targetUri;
      const sampleKey = targetUri.toLowerCase().trim();
      if (SAMPLE_ASSETS[sampleKey]) {
        const asset = Asset.fromModule(SAMPLE_ASSETS[sampleKey]);
        await asset.downloadAsync();
        resolvedUri = asset.localUri || asset.uri;
      }

      setScanStep('Running MobileNetV4 ONNX classification...');

      // 2. Run real ONNX vision classification
      const prediction = await classifyOliveLeaf(resolvedUri);

      setScanStep('Consulting verified Olive Pathology Database...');

      // 3. Persist to SQLite app.db
      const isHealthy = prediction.status === 'healthy';
      const session = await createSession(
        isHealthy ? 'Healthy Olive Foliage' : prediction.diseaseName
      );
      const savedImage = await saveImage({
        sessionId: session.id,
        relPath: targetUri,
      });
      await saveDiagnosis({
        imageId: savedImage.id,
        classLabel: prediction.classLabel,
        confidence: prediction.confidence,
        topkJson: JSON.stringify(prediction.topK),
        modelVersion: 'mobilenetv4_conv_small_fp32',
        latencyMs: prediction.latencyMs,
      });

      // 4. Default fields for Healthy leaf
      let scientificName = 'Olea europaea';
      let severity: 'None' | 'Low' | 'Moderate' | 'High' = 'None';
      let description =
        'Leaf displays healthy vegetative state with balanced chlorophyll distribution and no detected fungal or acarine infection.';
      let symptoms: string[] = [
        'Uniform green coloration across upper and lower epidermis',
        'Intact leaf margins and healthy waxy cuticle',
        'Absence of circular fungal lesions or bronze mite rusting',
      ];
      let recommendedTreatments: string[] = [
        'No fungicide or miticide treatment required',
        'Maintain balanced drip irrigation based on seasonal weather',
        'Periodically inspect lower and inner canopy branches',
      ];
      let preventiveMeasures: string[] = [
        'Ensure open canopy architecture through annual pruning for sunlight penetration',
        'Avoid excessive nitrogen fertilization to discourage pest attraction',
        'Monitor foliage humidity after extended spring and autumn rain events',
      ];

      // 5. Look up knowledge.db if a pathogen was detected
      if (!isHealthy) {
        severity = prediction.confidence > 85 ? 'High' : prediction.confidence > 60 ? 'Moderate' : 'Low';

        const diseaseRecord = await getDiseaseByLabel(prediction.classLabel);
        if (diseaseRecord) {
          scientificName = diseaseRecord.scientific_name || 'Olive pathogen';
          const doc = await getDiseaseDoc(diseaseRecord.id);
          if (doc && doc.content_md) {
            description = doc.content_md.slice(0, 280) + '...';
          }
        }

        if (prediction.classLabel === 'olivepeacockspot') {
          symptoms = [
            'Dark circular sooty lesions (peacock eye spots) on upper leaf surfaces',
            'Yellow chlorotic halos surrounding lesions during active fungal sporulation',
            'Premature leaf drop leading to twig dieback in dense, shaded canopy',
          ];
          recommendedTreatments = [
            'Apply preventive copper-based spray (Bordeaux mixture or copper hydroxide) in autumn before rain',
            'Consider early spring booster copper spray if winter conditions were mild and humid',
            'Prune dense interior branches to reduce humidity and accelerate leaf drying',
          ];
          preventiveMeasures = [
            'Avoid overhead irrigation that wets leaf surfaces',
            'Rake and dispose of heavily infected fallen leaves beneath trees',
            'Plant resistant olive cultivars in low-lying, fog-prone orchard blocks',
          ];
        } else if (prediction.classLabel === 'aculus_olive') {
          symptoms = [
            'Silvering, bronzing, and rusty discoloration along lower leaf surface',
            'Curling, cupping, or deformation of tender young spring flushes',
            'Premature flower drop and reduced fruit set on infested shoots',
          ];
          recommendedTreatments = [
            'Apply wettable sulfur or agricultural mineral oil during early spring shoot growth',
            'Time applications when mite populations start migrating to tender new leaves',
            'Conserve predatory mites (Phytoseiidae) by avoiding broad-spectrum synthetic pyrethroids',
          ];
          preventiveMeasures = [
            'Regularly inspect growing shoot tips with a 10x–20x hand lens in spring',
            'Avoid excessive nitrogen applications which stimulate succulent mite-favored growth',
            'Ensure adequate irrigation to mitigate tree drought stress',
          ];
        }
      }

      const now = new Date();
      const formattedDate =
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }) +
        ' • ' +
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

      const diagnosticResult: ScanResult = {
        id: session.id,
        imageUri: targetUri,
        diseaseName: prediction.diseaseName,
        scientificName,
        classLabel: prediction.classLabel,
        confidence: prediction.confidence,
        status: prediction.status,
        severity,
        date: formattedDate,
        description,
        userNote: `ONNX classification (${prediction.classLabel}) in ${prediction.latencyMs}ms.`,
        symptoms,
        recommendedTreatments,
        preventiveMeasures,
      };

      setScanResult(diagnosticResult);
      setIsScanning(false);
    } catch (error) {
      console.error('[Scanner] Inference error:', error);
      Alert.alert(
        'Inference Failed',
        'Could not complete vision classification: ' + (error as Error).message
      );
      setIsScanning(false);
    }
  };

  useEffect(() => {
    runDiagnosticScan(imageUri);
  }, [imageUri]);

  // Retake photo action
  const handleRetakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Camera permission is required to retake a photo of the olive leaf.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error retaking photo:', err);
      Alert.alert('Error', 'Unable to retake photo. Please try again.');
    }
  };

  // Re-upload from gallery action
  const handleReuploadGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Gallery access is required to choose another leaf photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error choosing gallery image:', err);
      Alert.alert('Error', 'Unable to select gallery photo. Please try again.');
    }
  };

  // Save to history
  const handleSaveToHistory = async () => {
    if (!scanResult || isSaved) return;

    setIsSaving(true);
    const success = await saveScanResult(scanResult);
    setIsSaving(false);

    if (success) {
      setIsSaved(true);
      Alert.alert(
        'Saved to History',
        'This diagnostic report has been saved to your records. You can review it anytime in the History tab.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Could not save this scan. Please try again.');
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Diagnostic Scanner</Text>
        <View style={styles.topBarRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Leaf Image & Animated Scan Line Frame */}
        <View style={styles.scanContainer}>
          <View style={styles.imageCard}>
            <LeafImage uri={imageUri} style={styles.leafImage} resizeMode="cover" />

            {/* Corner Viewfinder Brackets */}
            <View style={[styles.cornerBracket, styles.bracketTL]} />
            <View style={[styles.cornerBracket, styles.bracketTR]} />
            <View style={[styles.cornerBracket, styles.bracketBL]} />
            <View style={[styles.cornerBracket, styles.bracketBR]} />

            {/* Animated Laser Scanning Line */}
            {isScanning && (
              <>
                <View style={styles.scanOverlay} />
                <Animated.View
                  style={[
                    styles.laserLine,
                    {
                      transform: [{ translateY: scanLineAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', colors.gold, colors.primaryLight, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.laserGradient}
                  />
                  <View style={styles.laserGlow} />
                </Animated.View>
              </>
            )}

            {/* Scanning status banner overlay */}
            {isScanning && (
              <View style={styles.scanningBadge}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <MaterialCommunityIcons name="radar" size={20} color={colors.gold} />
                </Animated.View>
                <Text style={styles.scanningText}>{scanStep}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Scan Status Feedback during scanning */}
        {isScanning && (
          <View style={styles.analysisBox}>
            <Text style={styles.analysisTitle}>Analyzing Olive Leaf Features</Text>
            <Text style={styles.analysisDesc}>
              Deep learning model is inspecting chlorosis, circular halo margins, and leaf cuticle
              health...
            </Text>
            <View style={styles.loadingBarTrack}>
              <Animated.View
                style={[
                  styles.loadingBarProgress,
                  {
                    transform: [
                      {
                        scaleX: scanLineAnim.interpolate({
                          inputRange: [0, 260],
                          outputRange: [0.15, 0.98],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Diagnostic Results Card */}
        {!isScanning && scanResult && (
          <View style={styles.resultContainer}>
            <View style={styles.resultCard}>
              {/* Header with status tag */}
              <View style={styles.resultHeader}>
                <View style={styles.diseaseNameCol}>
                  <Text style={styles.diseaseLabel}>DIAGNOSTIC OUTCOME</Text>
                  <Text style={styles.diseaseTitle}>{scanResult.diseaseName}</Text>
                  <Text style={styles.scientificName}>{scanResult.scientificName}</Text>
                </View>
                <View
                  style={[
                    styles.outcomeBadge,
                    scanResult.status === 'healthy' ? styles.badgeHealthy : styles.badgeInfected,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={scanResult.status === 'healthy' ? 'shield-check' : 'alert-circle'}
                    size={16}
                    color={scanResult.status === 'healthy' ? '#166534' : '#991B1B'}
                  />
                  <Text
                    style={[
                      styles.outcomeBadgeText,
                      scanResult.status === 'healthy'
                        ? styles.badgeHealthyText
                        : styles.badgeInfectedText,
                    ]}
                  >
                    {scanResult.status === 'healthy' ? 'Healthy' : `${scanResult.severity} Risk`}
                  </Text>
                </View>
              </View>

              {/* Confidence Meter */}
              <View style={styles.confidenceSection}>
                <View style={styles.confidenceRow}>
                  <Text style={styles.confidenceLabel}>Model Confidence Score</Text>
                  <Text style={styles.confidencePercent}>{scanResult.confidence}%</Text>
                </View>
                <View style={styles.meterTrack}>
                  <View style={[styles.meterFill, { width: `${scanResult.confidence}%` }]} />
                </View>
              </View>



              {/* Recommended Treatments */}
              <View style={styles.infoBlock}>
                <View style={styles.infoBlockHeader}>
                  <MaterialCommunityIcons name="medical-bag" size={18} color={colors.gold} />
                  <Text style={styles.infoBlockTitle}>Recommended Agronomic Actions</Text>
                </View>
                {scanResult.recommendedTreatments.map((action, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons
                      name="checkbox"
                      size={15}
                      color={colors.primaryLight}
                      style={{ marginTop: 2 }}
                    />
                    <Text style={styles.bulletText}>{action}</Text>
                  </View>
                ))}
              </View>

              {/* Discuss with Olive AI Assistant Button */}
              <TouchableOpacity
                style={styles.discussAiBtn}
                onPress={() => {
                  router.push({
                    pathname: '/chat',
                    params: {
                      sessionId: scanResult.id,
                      diseaseName: scanResult.diseaseName,
                      classLabel:
                        scanResult.classLabel ||
                        (scanResult.status === 'healthy'
                          ? 'Healthy'
                          : scanResult.diseaseName.includes('mite')
                          ? 'aculus_olive'
                          : 'olivepeacockspot'),
                      confidence: scanResult.confidence.toString(),
                      imageUri: scanResult.imageUri,
                    },
                  });
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.discussAiGradient}
                >
                  <MaterialCommunityIcons name="chat-processing" size={20} color={colors.gold} />
                  <Text style={styles.discussAiText}>Discuss with Olive AI Assistant</Text>
                  <Ionicons name="sparkles" size={16} color={colors.gold} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Save to History Button */}
              <TouchableOpacity
                style={[styles.saveBtn, isSaved && styles.saveBtnDisabled]}
                onPress={handleSaveToHistory}
                disabled={isSaved || isSaving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    isSaved
                      ? ['#4B6B4E', '#3D593F']
                      : [colors.primary, colors.primaryDark]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGradient}
                >
                  <MaterialCommunityIcons
                    name={isSaved ? 'check-decagram' : 'bookmark-plus'}
                    size={20}
                    color={colors.gold}
                  />
                  <Text style={styles.saveBtnText}>
                    {isSaved ? 'Saved in History' : 'Save to History'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* "Photo not clear?" Section */}
        <View style={styles.reuploadSection}>
          <View style={styles.reuploadCard}>
            <View style={styles.reuploadHeader}>
              <View style={styles.reuploadIconBox}>
                <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.reuploadTextWrap}>
                <Text style={styles.reuploadTitle}>Photo not clear?</Text>
                <Text style={styles.reuploadSubtitle}>
                  Blurry or poor lighting affects diagnostic accuracy. Take another picture or select a
                  sharper file.
                </Text>
              </View>
            </View>

            <View style={styles.reuploadButtonsRow}>
              <TouchableOpacity
                style={[styles.reuploadBtn, styles.retakeBtn]}
                onPress={handleRetakePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-reverse-outline" size={18} color={colors.primaryDark} />
                <Text style={styles.retakeBtnText}>Retake photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reuploadBtn, styles.reuploadGalleryBtn]}
                onPress={handleReuploadGallery}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={18} color={colors.primaryDark} />
                <Text style={styles.reuploadGalleryBtnText}>Re-upload from gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  topBarRightPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  scanContainer: {
    padding: spacing.md,
  },
  imageCard: {
    position: 'relative',
    height: 280,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#1A2418',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  leafImage: {
    width: '100%',
    height: '100%',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(30, 43, 26, 0.35)',
  },
  laserLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 10,
  },
  laserGradient: {
    flex: 1,
    height: 4,
  },
  laserGlow: {
    height: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginTop: -4,
  },
  cornerBracket: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: colors.gold,
    zIndex: 20,
  },
  bracketTL: {
    top: 14,
    left: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  bracketTR: {
    top: 14,
    right: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bracketBL: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bracketBR: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  scanningBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 32, 18, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    zIndex: 30,
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  analysisBox: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  analysisTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  analysisDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  loadingBarTrack: {
    height: 6,
    backgroundColor: colors.olivePale,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  loadingBarProgress: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  resultContainer: {
    paddingHorizontal: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.medium,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  diseaseNameCol: {
    flex: 1,
    marginRight: 10,
  },
  diseaseLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  diseaseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: 2,
  },
  outcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  badgeHealthy: {
    backgroundColor: '#DCFCE7',
  },
  badgeInfected: {
    backgroundColor: '#FEE2E2',
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeHealthyText: {
    color: '#166534',
  },
  badgeInfectedText: {
    color: '#991B1B',
  },
  confidenceSection: {
    backgroundColor: colors.oliveSoftBg,
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confidencePercent: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  meterTrack: {
    height: 8,
    backgroundColor: colors.olivePale,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  infoBlock: {
    marginTop: 10,
    marginBottom: 10,
  },
  infoBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
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
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  discussAiBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 8,
    ...shadows.soft,
  },
  discussAiGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  discussAiText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.md,
    ...shadows.soft,
  },
  saveBtnDisabled: {
    opacity: 0.9,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  reuploadSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  reuploadCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  reuploadHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  reuploadIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reuploadTextWrap: {
    flex: 1,
  },
  reuploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reuploadSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  reuploadButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  reuploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  retakeBtn: {
    backgroundColor: colors.oliveSoftBg,
    borderColor: colors.oliveSage,
  },
  retakeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  reuploadGalleryBtn: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  reuploadGalleryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
