import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_PROFILE_KEY = "@NumPrime_UserProfile";

export interface UserProfile {
  nickname: string;
  isFirstTime: boolean;
  totalGamesPlayed: number;
  bestScore: number;
}

// Kullanıcı profili işlemleri
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const profile = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
};
