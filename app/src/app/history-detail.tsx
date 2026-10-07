import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';
import { ScanResult } from '../types';
import { getScanById, updateScanResult, deleteScanResult } from '../utils/historyStorage';
import { LeafImage } from '../components/LeafImage';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedDiseaseName, setEditedDiseaseName] = useState('');
  const [editedUserNote, setEditedUserNote] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (id) {
      loadScan(id);
    }
  }, [id]);

  const loadScan = async (scanId: string) => {
    const item = await getScanById(scanId);
    if (item) {
      setScan(item);
      setEditedDiseaseName(item.diseaseName);
      setEditedUserNote(item.userNote || '');
    }
  };

  const handleOpenEdit = () => {
    if (!scan) return;
    setEditedDiseaseName(scan.diseaseName);
    setEditedUserNote(scan.userNote || '');
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!scan || !editedDiseaseName.trim()) {
      Alert.alert('Validation Error', 'Disease name cannot be empty.');
      return;
    }

    setIsSavingEdit(true);
    const success = await updateScanResult(scan.id, {
      diseaseName: editedDiseaseName.trim(),
      userNote: editedUserNote.trim(),
    });
    setIsSavingEdit(false);

    if (success) {
      setScan((prev) =>
        prev
          ? {
              ...prev,
              diseaseName: editedDiseaseName.trim(),
              userNote: editedUserNote.trim(),
            }
          : null
      );
      setIsEditModalVisible(false);
      Alert.alert('Updated', 'Scan diagnosis and notes updated successfully.');
    } else {
      Alert.alert('Error', 'Could not save modifications. Please try again.');
    }
  };

  const handleDelete = () => {
    if (!scan) return;
    Alert.alert(
      'Delete Detection Record',
      `Are you sure you want to remove the detection record for "${scan.diseaseName}"? This will permanently delete the saved photo.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteScanResult(scan.id);
            Alert.alert('Deleted', 'Detection record removed.', [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]);
          },
        },
      ]
    );
  };

  if (!scan) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Scan Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <Text style={styles.loadingText}>Loading detection details...</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.topBarTitle}>Diagnosis Detail</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={handleOpenEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: '#FEE2E2' }]}
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Large Leaf Photo */}
        <View style={styles.imageCard}>
          <LeafImage uri={scan.imageUri} style={styles.largePhoto} resizeMode="cover" />
          <View
            style={[
              styles.statusFloatBadge,
              scan.status === 'healthy' ? styles.badgeHealthy : styles.badgeInfected,
            ]}
          >
            <MaterialCommunityIcons
              name={scan.status === 'healthy' ? 'shield-check' : 'alert-decagram'}
              size={16}
              color={scan.status === 'healthy' ? '#166534' : '#991B1B'}
            />
            <Text
              style={[
                styles.badgeText,
                scan.status === 'healthy' ? styles.badgeHealthyText : styles.badgeInfectedText,
              ]}
            >
              {scan.status === 'healthy' ? 'Healthy Foliage' : `${scan.severity} Risk`}
            </Text>
          </View>
        </View>

        {/* Diagnosis Outcome Card */}
        <View style={styles.card}>
          <View style={styles.diseaseHeaderRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.diseaseTitle}>{scan.diseaseName}</Text>
              <Text style={styles.scientificName}>{scan.scientificName}</Text>
            </View>
            <TouchableOpacity style={styles.quickEditBtn} onPress={handleOpenEdit}>
              <Ionicons name="pencil" size={14} color={colors.primary} />
              <Text style={styles.quickEditText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Confidence & Timestamp */}
          <View style={styles.metaRow}>
            <View style={styles.confidencePill}>
              <Text style={styles.confidenceLabel}>Confidence</Text>
              <Text style={styles.confidenceValue}>{scan.confidence}%</Text>
            </View>
            <View style={styles.datePill}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.dateValue}>{scan.date}</Text>
            </View>
          </View>

          {/* Description */}
          {scan.description ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>Pathology Overview</Text>
              <Text style={styles.bodyText}>{scan.description}</Text>
            </View>
          ) : null}

          {/* User Note */}
          <View style={styles.noteBox}>
            <View style={styles.noteHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="notebook-outline" size={18} color={colors.goldMuted} />
                <Text style={styles.noteHeading}>Grower’s Field Note</Text>
              </View>
              <TouchableOpacity onPress={handleOpenEdit}>
                <Text style={styles.noteEditLink}>Edit Note</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.noteContent}>
              {scan.userNote || 'No field note added yet. Tap "Edit Note" to log orchard conditions or treatments applied.'}
            </Text>
          </View>

          {/* Symptoms */}
          {scan.symptoms && scan.symptoms.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="eye-outline" size={18} color={colors.primary} />
                <Text style={styles.sectionHeading}>Identified Symptoms</Text>
              </View>
              {scan.symptoms.map((symptom, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{symptom}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommended Treatments */}
          {scan.recommendedTreatments && scan.recommendedTreatments.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="medical-bag" size={18} color={colors.gold} />
                <Text style={styles.sectionHeading}>Recommended Treatment & Actions</Text>
              </View>
              {scan.recommendedTreatments.map((treatment, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>{treatment}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons Row */}
          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.editFullBtn} onPress={handleOpenEdit} activeOpacity={0.85}>
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <Text style={styles.editFullBtnText}>Edit Record</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteFullBtn} onPress={handleDelete} activeOpacity={0.85}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteFullBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.editModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Detection Record</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Diagnosis / Disease Name</Text>
              <TextInput
                style={styles.textInput}
                value={editedDiseaseName}
                onChangeText={setEditedDiseaseName}
                placeholder="e.g. Olive Peacock Spot"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Grower Field Note</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editedUserNote}
                onChangeText={setEditedUserNote}
                placeholder="Add observations, orchard tree row number, or chemical spray details..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setIsEditModalVisible(false)}
                  disabled={isSavingEdit}
                >
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveModalBtn}
                  onPress={handleSaveEdit}
                  disabled={isSavingEdit}
                >
                  <Text style={styles.saveModalText}>
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
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
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 50,
  },
  imageCard: {
    position: 'relative',
    height: 260,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.olivePale,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  largePhoto: {
    width: '100%',
    height: '100%',
  },
  statusFloatBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    ...shadows.soft,
  },
  badgeHealthy: {
    backgroundColor: '#DCFCE7',
  },
  badgeInfected: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeHealthyText: {
    color: '#166534',
  },
  badgeInfectedText: {
    color: '#991B1B',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  diseaseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  diseaseTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.oliveSoftBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  confidencePill: {
    flex: 1,
    backgroundColor: colors.oliveSoftBg,
    padding: 10,
    borderRadius: borderRadius.sm,
  },
  confidenceLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2,
  },
  datePill: {
    flex: 1.3,
    backgroundColor: colors.backgroundSecondary,
    padding: 10,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionBlock: {
    marginTop: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  noteBox: {
    backgroundColor: colors.backgroundSecondary,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    borderRadius: borderRadius.sm,
    padding: 12,
    marginTop: spacing.md,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  noteEditLink: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  noteContent: {
    fontSize: 13,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
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
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  editFullBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  editFullBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteFullBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  deleteFullBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  editModalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalScroll: {
    paddingBottom: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textArea: {
    height: 90,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.lg,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveModalBtn: {
    flex: 1.5,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  saveModalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
