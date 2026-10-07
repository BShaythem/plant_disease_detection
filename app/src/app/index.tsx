import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography } from '../constants/theme';

// Keep native splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => { });

const { width } = Dimensions.get('window');

export default function SplashScreenComponent() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const leafSpinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide the native splash screen smoothly
    SplashScreen.hideAsync().catch(() => { });

    // Run fade-in & scale animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle gentle pulse / glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(leafSpinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(leafSpinAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Stay visible for 2.5 seconds, then transition to Home
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#182613', '#2B4222', '#415E32', '#22361B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glow backdrop circle */}
        <View style={styles.glowCircle} />

        {/* Central Logo Asset */}
        <View style={styles.iconCircle}>
          <Image
            source={require('../../assets/images/splash-icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Brand Name */}
        <Animated.View style={{ opacity: textFadeAnim, alignItems: 'center' }}>
          <View style={styles.titleRow}>
            <Text style={styles.brandTitle}>Olive Care</Text>
          </View>

          {/* Tagline */}
          <View style={styles.taglineBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color={colors.gold} />
            <Text style={styles.taglineText}>Protect your olive trees</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Bottom phytopathology signature */}
      <View style={styles.bottomFooter}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>AI Orchard Pathology • Precision AgriTech</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E4423',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FAF8F2',
    letterSpacing: 1.2,
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginTop: 8,
  },
  taglineText: {
    fontSize: 13,
    color: colors.goldLight,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    gap: 8,
  },
  footerLine: {
    width: 36,
    height: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 1,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(240, 244, 236, 0.65)',
    fontWeight: '500',
    letterSpacing: 0.8,
  },
});
