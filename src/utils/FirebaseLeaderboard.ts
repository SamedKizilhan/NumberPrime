import firebaseConfig from "../config/firebase-config";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  equalTo,
  get,
  push,
  set,
  update,
} from "firebase/database";
import { PlayerScore } from "../types/GameTypes";

// Firebase'i initialize et
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export class FirebaseLeaderboard {
  // Nickname unique kontrolü
  static async checkNicknameExists(nickname: string): Promise<boolean> {
    try {
      const playersRef = ref(database, "players");
      const nicknameQuery = query(
        playersRef,
        orderByChild("nickname_lower"),
        equalTo(nickname.toLowerCase())
      );
      const snapshot = await get(nicknameQuery);

      return snapshot.exists();
    } catch (error) {
      console.error("Firebase nickname kontrolü hatası:", error);
      return false;
    }
  }

  // Oyuncu kaydı (nickname rezerve etme)
  static async registerPlayer(nickname: string): Promise<boolean> {
    try {
      // Önce kontrol et
      const exists = await FirebaseLeaderboard.checkNicknameExists(nickname);
      if (exists) {
        return false;
      }

      // Player kaydı oluştur
      const playersRef = ref(database, "players");
      const newPlayerRef = push(playersRef);

      await set(newPlayerRef, {
        nickname: nickname,
        nickname_lower: nickname.toLowerCase(),
        bestScore: 0,
        createdAt: Date.now(),
      });

      return true;
    } catch (error) {
      console.error("Firebase oyuncu kayıt hatası:", error);
      return false;
    }
  }

  // Global skor kaydet
  static async saveGlobalScore(playerScore: PlayerScore): Promise<void> {
    try {
      console.log(
        "Saving score for:",
        playerScore.nickname,
        "Score:",
        playerScore.score
      );

      // Önce oyuncunun mevcut en iyi skoru var mı kontrol et
      const playersRef = ref(database, "players");
      const playerQuery = query(
        playersRef,
        orderByChild("nickname_lower"),
        equalTo(playerScore.nickname.toLowerCase())
      );
      const playerSnapshot = await get(playerQuery);

      console.log("Player exists in database:", playerSnapshot.exists());

      let playerId = null;
      if (playerSnapshot.exists()) {
        // Player mevcutsa güncelle
        playerSnapshot.forEach((child) => {
          playerId = child.key;
          const currentBestScore = child.val().bestScore || 0;
          console.log(
            "Current best score:",
            currentBestScore,
            "New score:",
            playerScore.score
          );

          // Eğer yeni skor daha iyiyse güncelle
          if (playerScore.score > currentBestScore) {
            console.log("Updating player's best score");
            const playerRef = ref(database, `players/${child.key}`);
            update(playerRef, {
              bestScore: playerScore.score,
              title: playerScore.title,
              lastPlayDate: playerScore.date,
            });
          }
          return true;
        });
      } else {
        // Player bulunamazsa yeni kayıt oluştur
        console.log("Player not found, creating new player record");
        const playersRef = ref(database, "players");
        const newPlayerRef = push(playersRef);

        await set(newPlayerRef, {
          nickname: playerScore.nickname,
          nickname_lower: playerScore.nickname.toLowerCase(),
          bestScore: playerScore.score,
          title: playerScore.title,
          createdAt: Date.now(),
          lastPlayDate: playerScore.date,
        });

        playerId = newPlayerRef.key;
        console.log("New player created with ID:", playerId);
      }

      console.log("Player ID:", playerId);

      // Skorları da kaydet (tüm skorlar için)
      const scoresRef = ref(database, "scores");
      const newScoreRef = push(scoresRef);

      await set(newScoreRef, {
        ...playerScore,
        playerId: playerId,
        timestamp: Date.now(),
      });

      console.log("Score saved to scores collection");
    } catch (error) {
      console.error("Firebase skor kaydetme hatası:", error);
    }
  }

  // İlk 47 oyuncuyu getir
  static async getTop47(): Promise<PlayerScore[]> {
    try {
      console.log("Getting top 47 players...");
      const playersRef = ref(database, "players");

      // Direct get yerine once kullan ve biraz bekle
      await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms bekle

      const snapshot = await get(playersRef);

      console.log("Snapshot exists:", snapshot.exists());
      console.log("Snapshot val:", snapshot.val()); // Tüm raw data'yı göster

      const allPlayers: PlayerScore[] = [];
      const rawData = snapshot.val();

      // Manual iteration
      if (rawData) {
        Object.keys(rawData).forEach((key) => {
          const player = rawData[key];

          if (player && player.bestScore > 0) {
            allPlayers.push({
              id: key,
              nickname: player.nickname,
              score: player.bestScore,
              date: player.lastPlayDate || "",
              title: player.title || "",
            });
          }
        });
      }

      // JavaScript'te sırala (yüksekten düşüğe)
      const sortedPlayers = allPlayers.sort((a, b) => b.score - a.score);

      // İlk 47'yi al
      const top47 = sortedPlayers.slice(0, 47);

      return top47;
    } catch (error) {
      console.error("Firebase top 47 getirme hatası:", error);
      return [];
    }
  }

  // Oyuncunun global sıralamasını getir
  static async getPlayerGlobalRank(nickname: string): Promise<{
    rank: number;
    totalPlayers: number;
    playerScore: PlayerScore | null;
  }> {
    try {
      const playersRef = ref(database, "players");
      const snapshot = await get(playersRef);

      const allPlayers: Array<{ key: string; data: any }> = [];
      const rawData = snapshot.val();

      if (rawData) {
        Object.keys(rawData).forEach((key) => {
          const player = rawData[key];
          if (player && player.bestScore > 0) {
            allPlayers.push({
              key: key,
              data: player,
            });
          }
        });
      }

      // JavaScript'te sırala (yüksekten düşüğe)
      const sortedPlayers = allPlayers.sort(
        (a, b) => b.data.bestScore - a.data.bestScore
      );

      // Oyuncuyu bul
      const playerIndex = sortedPlayers.findIndex((player) => {
        return player.data.nickname.toLowerCase() === nickname.toLowerCase();
      });

      if (playerIndex === -1) {
        return {
          rank: -1,
          totalPlayers: sortedPlayers.length,
          playerScore: null,
        };
      }

      const playerData = sortedPlayers[playerIndex].data;

      return {
        rank: playerIndex + 1,
        totalPlayers: sortedPlayers.length,
        playerScore: {
          id: sortedPlayers[playerIndex].key,
          nickname: playerData.nickname,
          score: playerData.bestScore,
          date: playerData.lastPlayDate || "",
          title: playerData.title || "",
        },
      };
    } catch (error) {
      console.error("Firebase oyuncu sıralaması hatası:", error);
      return {
        rank: -1,
        totalPlayers: 0,
        playerScore: null,
      };
    }
  }

  // Top 47 ve oyuncunun sıralamasını getir (ana fonksiyon)
  static async getGlobalLeaderboardWithPlayer(playerNickname: string): Promise<{
    top47: PlayerScore[];
    playerRank: number;
    playerScore: PlayerScore | null;
    totalPlayers: number;
  }> {
    try {
      console.log("FirebaseLeaderboard: Getting data for", playerNickname);

      const [top47, playerRankData] = await Promise.all([
        FirebaseLeaderboard.getTop47(),
        FirebaseLeaderboard.getPlayerGlobalRank(playerNickname),
      ]);

      return {
        top47,
        playerRank: playerRankData.rank,
        playerScore: playerRankData.playerScore,
        totalPlayers: playerRankData.totalPlayers,
      };
    } catch (error) {
      console.error("Firebase combined leaderboard hatası:", error);
      return {
        top47: [],
        playerRank: -1,
        playerScore: null,
        totalPlayers: 0,
      };
    }
  }
}
