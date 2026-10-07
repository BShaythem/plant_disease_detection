import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';

export default function AgronomySupportScreen() {
  const handleContactExpert = (expertName: string) => {
    Alert.alert(
      'Agronomic Advisory',
      `Connecting to ${expertName}. In production, this can initiate an email consultation or dial your designated farm advisor.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Agronomy Advisory</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerCard}>
          <MaterialCommunityIcons name="shield-account" size={32} color={colors.gold} />
          <Text style={styles.bannerTitle}>Phytosanitary Expert Network</Text>
          <Text style={styles.bannerText}>
            For acute fungal defoliation or rapid branch apoplexy, consult certified Mediterranean
            phytosanitary extension agents.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Regional Extension Contacts</Text>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleContactExpert('Dr. Elena Rostova (Mediterranean Phytopathology Hub)')}
            activeOpacity={0.8}
          >
            <View style={styles.contactIconCircle}>
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>Dr. Elena Rostova</Text>
              <Text style={styles.contactRole}>Mediterranean Phytopathology Hub • Fungus Control</Text>
            </View>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleContactExpert('Marco Valente (Soil & Agro-Hydrology Advisory)')}
            activeOpacity={0.8}
          >
            <View style={styles.contactIconCircle}>
              <Ionicons name="water" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>Marco Valente</Text>
              <Text style={styles.contactRole}>Soil & Agro-Hydrology Advisory • Verticillium Mitigation</Text>
            </View>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Emergency Spray Guidelines</Text>
          <View style={styles.guidelineRow}>
            <Ionicons name="warning-outline" size={18} color={colors.warning} style={{ marginTop: 2 }} />
            <Text style={styles.guidelineText}>
              Ensure protective copper applications are conducted strictly on dry leaves at least 2 hours before rain events.
            </Text>
          </View>
          <View style={styles.guidelineRow}>
            <Ionicons name="cut-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.guidelineText}>
              Disinfect shears with 70% ethanol between every cut when pruning Pseudomonas galls or dead Verticillium shoots.
            </Text>
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  bannerText: {
    fontSize: 13,
    color: colors.olivePale,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
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
    marginBottom: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contactRole: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  guidelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  guidelineText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
