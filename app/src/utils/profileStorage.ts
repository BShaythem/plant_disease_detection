import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { MOCK_USER_PROFILE } from './mockData';

const PROFILE_STORAGE_KEY = '@olive_care_user_profile_v1';

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const jsonValue = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      return { ...MOCK_USER_PROFILE, ...parsed };
    }
    // Seed default
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(MOCK_USER_PROFILE));
    return MOCK_USER_PROFILE;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return MOCK_USER_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}
