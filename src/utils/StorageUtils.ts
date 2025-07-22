import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerScore } from '../types/GameTypes';

const LEADERBOARD_KEY = '@NumPrime_Leaderboard';
const USER_PROFILE_KEY = '@NumPrime_UserProfile';

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
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};

export const checkNicknameExists = async (nickname: string): Promise<boolean> => {
  try {
    const leaderboard = await getLeaderboard();
    return leaderboard.some(player => 
      player.nickname.toLowerCase() === nickname.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking nickname:', error);
    return false;
  }
};

// Leaderboard işlemleri
export const getLeaderboard = async (): Promise<PlayerScore[]> => {
  try {
    const leaderboard = await AsyncStorage.getItem(LEADERBOARD_KEY);
    return leaderboard ? JSON.parse(leaderboard) : [];
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
};

export const saveScore = async (playerScore: PlayerScore): Promise<void> => {
  try {
    const currentLeaderboard = await getLeaderboard();
    
    // Aynı kullanıcının daha iyi skoru var mı kontrol et
    const existingPlayerIndex = currentLeaderboard.findIndex(
      player => player.nickname.toLowerCase() === playerScore.nickname.toLowerCase()
    );

    if (existingPlayerIndex !== -1) {
      // Eğer yeni skor daha iyiyse güncelle
      if (playerScore.score > currentLeaderboard[existingPlayerIndex].score) {
        currentLeaderboard[existingPlayerIndex] = playerScore;
      }
    } else {
      // Yeni oyuncu ekle
      currentLeaderboard.push(playerScore);
    }

    // Skora göre sırala (yüksekten düşüğe)
    const sortedLeaderboard = currentLeaderboard.sort((a, b) => b.score - a.score);

    await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sortedLeaderboard));
  } catch (error) {
    console.error('Error saving score:', error);
  }
};

export const getPlayerRank = async (nickname: string): Promise<number> => {
  try {
    const leaderboard = await getLeaderboard();
    const playerIndex = leaderboard.findIndex(
      player => player.nickname.toLowerCase() === nickname.toLowerCase()
    );
    return playerIndex !== -1 ? playerIndex + 1 : -1;
  } catch (error) {
    console.error('Error getting player rank:', error);
    return -1;
  }
};

export const getTop50WithPlayer = async (playerNickname: string): Promise<{
  top50: PlayerScore[];
  playerRank: number;
  playerScore: PlayerScore | null;
  totalPlayers: number;
}> => {
  try {
    const fullLeaderboard = await getLeaderboard();
    const top50 = fullLeaderboard.slice(0, 50);
    
    const playerIndex = fullLeaderboard.findIndex(
      player => player.nickname.toLowerCase() === playerNickname.toLowerCase()
    );
    
    const playerRank = playerIndex !== -1 ? playerIndex + 1 : -1;
    const playerScore = playerIndex !== -1 ? fullLeaderboard[playerIndex] : null;
    
    return {
      top50,
      playerRank,
      playerScore,
      totalPlayers: fullLeaderboard.length
    };
  } catch (error) {
    console.error('Error getting leaderboard with player:', error);
    return {
      top50: [],
      playerRank: -1,
      playerScore: null,
      totalPlayers: 0
    };
  }
};

// Test verisi oluşturma (sadece geliştirme için)
export const createMockLeaderboard = async (): Promise<void> => {
  const mockData: PlayerScore[] = [
    {
      id: '1',
      nickname: 'MathMaster',
      score: 25430,
      date: new Date().toLocaleDateString(),
      title: 'Matematik Dehası'
    },
    {
      id: '2',
      nickname: 'PrimeHunter',
      score: 18750,
      date: new Date().toLocaleDateString(),
      title: 'Asal Avcısı'
    },
    {
      id: '3',
      nickname: 'NumberNinja',
      score: 12300,
      date: new Date().toLocaleDateString(),
      title: 'Sayı Ustası'
    },
    {
      id: '4',
      nickname: 'CalcPro',
      score: 9850,
      date: new Date().toLocaleDateString(),
      title: 'Hesap Makinesi'
    },
    {
      id: '5',
      nickname: 'MathWizard',
      score: 7200,
      date: new Date().toLocaleDateString(),
      title: 'Matematik Büyücüsü'
    }
  ];

  await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(mockData));
};