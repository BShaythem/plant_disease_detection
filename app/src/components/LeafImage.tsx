import React, { useState } from 'react';
import { StyleSheet, View, Image, ImageProps, StyleProp, ImageStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

export const SAMPLE_ASSETS: Record<string, any> = {
  sample1: require('../../assets/samples/sample1.jpg'),
  sample2: require('../../assets/samples/sample2.jpg'),
  sample3: require('../../assets/samples/sample3.jpg'),
  sample4: require('../../assets/samples/sample4.jpg'),
  sample5: require('../../assets/samples/sample5.jpg'),
  sample6: require('../../assets/samples/sample6.jpg'),
  'sample1.jpg': require('../../assets/samples/sample1.jpg'),
  'sample2.jpg': require('../../assets/samples/sample2.jpg'),
  'sample3.jpg': require('../../assets/samples/sample3.jpg'),
  'sample4.jpg': require('../../assets/samples/sample4.jpg'),
  'sample5.jpg': require('../../assets/samples/sample5.jpg'),
  'sample6.jpg': require('../../assets/samples/sample6.jpg'),
};

export const FALLBACK_IMAGE = require('../../assets/samples/sample6.jpg');

interface LeafImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export function LeafImage({ uri, style, resizeMode = 'cover' }: LeafImageProps) {
  const [hasError, setHasError] = useState(false);

  // If no uri provided or load error, render fallback with leaf icon overlay
  if (!uri || hasError) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Image
          source={FALLBACK_IMAGE}
          style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
          resizeMode={resizeMode}
        />
        <View style={styles.fallbackIconBadge}>
          <MaterialCommunityIcons name="leaf" size={20} color={colors.gold} />
        </View>
      </View>
    );
  }

  // Check if uri references one of the bundled sample keys
  const sampleKey = uri.toLowerCase().trim();
  if (SAMPLE_ASSETS[sampleKey]) {
    return (
      <Image
        source={SAMPLE_ASSETS[sampleKey]}
        style={style}
        resizeMode={resizeMode}
        onError={() => setHasError(true)}
      />
    );
  }

  // Otherwise load from file:// or http:// or content://
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: colors.olivePale,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallbackIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 68, 35, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
});
