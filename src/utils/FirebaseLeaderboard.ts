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
  limitToLast,
} from "@react-native-firebase/database";
import { PlayerScore } from "../types/GameTypes";

export class FirebaseLeaderboard {
  // Nickname unique kontrolü
  static async checkNicknameExists(nickname: string): Promise<boolean> {
    try {
      const database = getDatabase();
      const playersRef = ref(database, "/players");
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
      const database = getDatabase();
      const playersRef = ref(database, "/players");
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
      const database = getDatabase();

      // Önce oyuncunun mevcut en iyi skoru var mı kontrol et
      const playersRef = ref(database, "/players");
      const playerQuery = query(
        playersRef,
        orderByChild("nickname_lower"),
        equalTo(playerScore.nickname.toLowerCase())
      );
      const playerSnapshot = await get(playerQuery);

      let playerId = null;
      playerSnapshot.forEach((child) => {
        playerId = child.key;
        const currentBestScore = child.val().bestScore || 0;

        // Eğer yeni skor daha iyiyse güncelle
        if (playerScore.score > currentBestScore) {
          const playerRef = ref(database, `/players/${child.key}`);
          update(playerRef, {
            bestScore: playerScore.score,
            title: playerScore.title,
            lastPlayDate: playerScore.date,
          });
        }
        return true;
      });

      // Skorları da kaydet (tüm skorlar için)
      const scoresRef = ref(database, "/scores");
      const newScoreRef = push(scoresRef);

      await set(newScoreRef, {
        ...playerScore,
        playerId: playerId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Firebase skor kaydetme hatası:", error);
    }
  }

  // İlk 47 oyuncuyu getir
  static async getTop47(): Promise<PlayerScore[]> {
    try {
      const database = getDatabase();
      const playersRef = ref(database, "/players");
      const topPlayersQuery = query(
        playersRef,
        orderByChild("bestScore"),
        limitToLast(47)
      );
      const snapshot = await get(topPlayersQuery);

      const scores: PlayerScore[] = [];
      snapshot.forEach((child) => {
        const player = child.val();
        if (player.bestScore > 0) {
          scores.unshift({
            id: child.key || "",
            nickname: player.nickname,
            score: player.bestScore,
            date: player.lastPlayDate || "",
            title: player.title || "",
          });
        }
        return true;
      });

      return scores;
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
      const database = getDatabase();
      const playersRef = ref(database, "/players");
      const allPlayersQuery = query(playersRef, orderByChild("bestScore"));
      const snapshot = await get(allPlayersQuery);

      const allPlayers: Array<{ key: string; data: any }> = [];
      snapshot.forEach((child) => {
        const player = child.val();
        if (player.bestScore > 0) {
          allPlayers.unshift({
            key: child.key || "",
            data: player,
          });
        }
        return true;
      });

      // Oyuncuyu bul
      const playerIndex = allPlayers.findIndex(
        (player) =>
          player.data.nickname.toLowerCase() === nickname.toLowerCase()
      );

      if (playerIndex === -1) {
        return {
          rank: -1,
          totalPlayers: allPlayers.length,
          playerScore: null,
        };
      }

      const playerData = allPlayers[playerIndex].data;
      return {
        rank: playerIndex + 1,
        totalPlayers: allPlayers.length,
        playerScore: {
          id: allPlayers[playerIndex].key,
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

  // Hem top 47 hem de oyuncunun sıralamasını getir
  static async getGlobalLeaderboardWithPlayer(playerNickname: string): Promise<{
    top47: PlayerScore[];
    playerRank: number;
    playerScore: PlayerScore | null;
    totalPlayers: number;
  }> {
    try {
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
