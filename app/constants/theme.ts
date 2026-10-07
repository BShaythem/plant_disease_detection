/**
 * Olive Care - Theme Constants
 * A sophisticated agricultural palette featuring olive greens, cream backgrounds, and warm gold accents.
 */

export const colors = {
  // Olive Green Spectrum
  primary: '#4D6B3C',         // Classic Olive Leaf Green
  primaryDark: '#2E4423',     // Deep Forest Olive
  primaryLight: '#6B8E4E',    // Sunlit Olive
  oliveMoss: '#3F5233',       // Earthy Moss
  oliveSage: '#8FA382',       // Sage Green
  olivePale: '#E2EAD9',       // Very light herbal tint
  oliveSoftBg: '#F0F4EC',     // Soft tinted container
  
  // Cream / Warm Natural Backgrounds
  background: '#FAF8F2',      // Warm Cream White
  backgroundSecondary: '#F3EFE6', // Soft Linen
  surface: '#FFFFFF',         // Pure White Card Surface
  surfaceMuted: '#F6F3EB',    // Warm tinted card surface

  // Gold & Sun Accents
  gold: '#D4AF37',            // Elegant Rich Gold
  goldLight: '#E8CA65',       // Bright Golden Sun
  goldMuted: '#C5A038',       // Antique Bronze Gold
  goldSubtle: '#FBF5DC',      // Soft Gold Tint

  // Status & Utility Colors
  success: '#3F7A4A',
  warning: '#D9822B',
  danger: '#BD3B3B',
  info: '#4B7B94',

  // Typography
  textPrimary: '#1E2B1A',     // Deepest Forest Charcoal for crisp readability
  textSecondary: '#5C6D58',   // Soft Olive Grey
  textMuted: '#8D9B89',       // Subtle Grey
  textOnPrimary: '#FFFFFF',   // White text on dark buttons
  textGold: '#9A7718',        // Readable gold text

  // Borders & Dividers
  border: '#E3DFD4',
  borderLight: '#ECE7DD',
  borderFocus: '#4D6B3C',

  // Gradients (tuples for expo-linear-gradient)
  gradients: {
    header: ['#24381C', '#3E592D', '#54763F'] as const,
    gold: ['#E8CA65', '#D4AF37', '#B88E23'] as const,
    card: ['#FFFFFF', '#FAF8F3'] as const,
    oliveHero: ['#3A532B', '#4D6B3C'] as const,
    scannerOverlay: ['rgba(77, 107, 60, 0.05)', 'rgba(77, 107, 60, 0.25)'] as const,
  },
};

export const typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 34,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  full: 9999,
};

export const shadows = {
  soft: {
    shadowColor: '#2E4423',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  medium: {
    shadowColor: '#2E4423',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  goldGlow: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
};
