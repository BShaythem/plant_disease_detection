import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';
import { UserProfile } from '../../types';
import { getUserProfile } from '../../utils/profileStorage';
import { getScanHistory } from '../../utils/historyStorage';

export default function AccountScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [totalScansCount, setTotalScansCount] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then((data) => setProfile(data));
      getScanHistory().then((data) => setTotalScansCount(data.length));
    }, [])
  );

  const handleResetData = () => {
    Alert.alert(
      'Reset Local Cache',
      'This will reset cached thumbnails and refresh the offline pathogen definitions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            Alert.alert('Cache Reset', 'Diagnostic parameters have been restored to defaults.');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Olive Care',
      'Olive Care Mobile v1.0.0\n\nAI-powered phytosanitary vision diagnostics designed for olive orchards. Detects Spilocaea oleagina, Pseudomonas savastanoi, Verticillium dahliae, Colletotrichum, and nutrient deficiencies directly from leaf photographs.',
      [{ text: 'Close' }]
    );
  };

  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Julien Laurent';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Profile */}
        <LinearGradient
          colors={colors.gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.profileRow}>
            <View style={styles.avatarBorder}>
              {profile?.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatarInner} />
              ) : (
                <View style={styles.avatarInnerPlaceholder}>
                  <Ionicons name="person" size={32} color={colors.gold} />
                </View>
              )}
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{fullName}</Text>
              <Text style={styles.profileEmail}>{profile?.email || 'julien.laurent@olivegrove.org'}</Text>
              <Text style={styles.profileFarm}>{profile?.farmName || 'Val d’Olive Heritage Orchard'}</Text>
              <View style={styles.regionRow}>
                <Ionicons name="location-outline" size={12} color={colors.olivePale} />
                <Text style={styles.regionText}>{profile?.region || 'Provence-Alpes-Côte d’Azur, France'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editProfileIconBtn}
              onPress={() => router.push('/edit-profile')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="pencil" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Orchard Stats */}
          <View style={styles.statsCard}>
            <TouchableOpacity
              style={styles.statCol}
              onPress={() => router.push('/my-scans')}
              activeOpacity={0.8}
            >
              <Text style={styles.statNumber}>{totalScansCount}</Text>
              <Text style={styles.statCaption}>Total Scans</Text>
            </TouchableOpacity>
            <View style={styles.statSep} />
            <View style={styles.statCol}>
              <Text style={[styles.statNumber, { color: colors.goldLight }]}>
                {profile?.oliveTreeCount || 340}
              </Text>
              <Text style={styles.statCaption}>Olive Trees</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{profile?.memberSince || '2024'}</Text>
              <Text style={styles.statCaption}>Member Since</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Account Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile & Orchard Analytics</Text>
          <View style={styles.menuCard}>
            {/* Edit Profile */}
            <TouchableOpacity
              style={styles.touchableMenuItem}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconCircle}>
                <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Edit Profile</Text>
                <Text style={styles.menuSubtitle}>Change name, Gmail address, and grower photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* My Scans */}
            <TouchableOpacity
              style={styles.touchableMenuItem}
              onPress={() => router.push('/my-scans')}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconCircle}>
                <MaterialCommunityIcons name="chart-box-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>My Scans & Analytics</Text>
                <Text style={styles.menuSubtitle}>Pathology statistics, healthy ratios, and breakdowns</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Diagnostic Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnostics & Pathogens</Text>
          <View style={styles.menuCard}>
            {/* Diagnostic Settings */}
            <TouchableOpacity
              style={styles.touchableMenuItem}
              onPress={() => router.push('/diagnostic-settings')}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconCircle}>
                <Ionicons name="options-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Diagnostic Settings</Text>
                <Text style={styles.menuSubtitle}>High-res capture, auto-save, and offline inference</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Supported Diseases */}
            <TouchableOpacity
              style={styles.touchableMenuItem}
              onPress={() => router.push('/supported-diseases')}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconCircle}>
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Diagnosable Olive Pathogens</Text>
                <Text style={styles.menuSubtitle}>Peacock Spot, Olive Knot, Verticillium, and Anthracnose</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & System Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App & Support</Text>
          <View style={styles.menuCard}>
            {/* Agronomic Support */}
            <TouchableOpacity
              style={styles.touchableMenuItem}
              onPress={() => router.push('/agronomy-support')}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconCircle}>
                <Ionicons name="medkit-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Agronomic Advisory Network</Text>
                <Text style={styles.menuSubtitle}>Phytopathology advice & expert contacts</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Reset cache */}
            <TouchableOpacity
              style={styles.touchableMenuItem}
              onPress={handleResetData}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconCircle}>
                <Ionicons name="refresh-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>Reset Offline Cache</Text>
                <Text style={styles.menuSubtitle}>Clear image buffer and reload defaults</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* About App */}
            <TouchableOpacity
              style={styles.touchableMenuItem}
              onPress={handleAbout}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconCircle}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle}>About Olive Care</Text>
                <Text style={styles.menuSubtitle}>Version 1.0.0 • English • Precision Phytosanitary Vision</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: spacing.md,
  },
  avatarBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  avatarInnerPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileEmail: {
    fontSize: 12,
    color: colors.olivePale,
    marginTop: 1,
  },
  profileFarm: {
    fontSize: 13,
    color: colors.goldLight,
    fontWeight: '600',
    marginTop: 2,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  regionText: {
    fontSize: 11,
    color: colors.olivePale,
  },
  editProfileIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    marginTop: 4,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statCaption: {
    fontSize: 11,
    color: colors.olivePale,
    fontWeight: '500',
    marginTop: 2,
  },
  statSep: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  touchableMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.oliveSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
    marginRight: 8,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
});
