import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { ScanResult } from '../types';
import { MOCK_INITIAL_HISTORY } from './mockData';

const STORAGE_KEY = '@olive_care_scan_history_v2';

/**
 * Copies a temporary captured/imported image into the app's persistent document directory.
 */
export async function persistScanImage(sourceUri: string): Promise<string> {
  // If it's a bundled sample identifier or remote image or on web, return as is
  if (!sourceUri || sourceUri.startsWith('sample') || sourceUri.startsWith('http') || Platform.OS === 'web') {
    return sourceUri;
  }

  try {
    const docDir = FileSystem.documentDirectory;
    if (!docDir) return sourceUri;

    const scansDir = `${docDir}olive_scans/`;
    const dirInfo = await FileSystem.getInfoAsync(scansDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(scansDir, { intermediates: true });
    }

    const fileExtension = sourceUri.split('.').pop() || 'jpg';
    const destinationUri = `${scansDir}scan_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExtension}`;

    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });

    return destinationUri;
  } catch (error) {
    console.warn('Could not copy image to document directory, falling back to original uri:', error);
    return sourceUri;
  }
}

export async function getScanHistory(): Promise<ScanResult[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    // Initialize with mock history on first run
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INITIAL_HISTORY));
    return MOCK_INITIAL_HISTORY;
  } catch (error) {
    console.error('Error reading scan history:', error);
    return MOCK_INITIAL_HISTORY;
  }
}

export async function getScanById(id: string): Promise<ScanResult | null> {
  const history = await getScanHistory();
  return history.find((item) => item.id === id) || null;
}

export async function saveScanResult(result: ScanResult): Promise<boolean> {
  try {
    // Ensure image is persisted in document directory
    const persistedUri = await persistScanImage(result.imageUri);
    const itemToSave: ScanResult = {
      ...result,
      imageUri: persistedUri,
    };

    const current = await getScanHistory();
    const updated = [itemToSave, ...current.filter((item) => item.id !== itemToSave.id)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error saving scan result:', error);
    return false;
  }
}

export async function updateScanResult(
  id: string,
  updates: Partial<Pick<ScanResult, 'diseaseName' | 'userNote' | 'scientificName'>>
): Promise<boolean> {
  try {
    const current = await getScanHistory();
    const index = current.findIndex((item) => item.id === id);
    if (index === -1) return false;

    current[index] = {
      ...current[index],
      ...updates,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return true;
  } catch (error) {
    console.error('Error updating scan result:', error);
    return false;
  }
}

export async function deleteScanResult(id: string): Promise<boolean> {
  try {
    const current = await getScanHistory();
    const itemToDelete = current.find((item) => item.id === id);

    // If item had a locally stored file, delete it
    if (itemToDelete && itemToDelete.imageUri && Platform.OS !== 'web') {
      const docDir = FileSystem.documentDirectory;
      if (docDir && itemToDelete.imageUri.startsWith(docDir)) {
        try {
          await FileSystem.deleteAsync(itemToDelete.imageUri, { idempotent: true });
        } catch (e) {
          console.warn('Could not delete local image file:', e);
        }
      }
    }

    const updated = current.filter((item) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error deleting scan result:', error);
    return false;
  }
}

export async function clearAllHistory(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing scan history:', error);
    return false;
  }
}
