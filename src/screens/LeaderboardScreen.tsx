import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
} from "react-native";
import { PlayerScore } from "../types/GameTypes";
import { getPlayerTitleKey } from "../utils/GameUtils";
import { useTranslation } from "react-i18next";
import { FirebaseLeaderboard } from "../utils/FirebaseLeaderboard";

interface LeaderboardScreenProps {
  onBack: () => void;
  playerNickname: string;
}

const { width, height } = Dimensions.get("window");

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  onBack,
  playerNickname,
}) => {
  const { t } = useTranslation();
  const [top47, setTop47] = useState<PlayerScore[]>([]);
  const [playerRank, setPlayerRank] = useState<number>(-1);
  const [playerScore, setPlayerScore] = useState<PlayerScore | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Android geri tuşu kontrolü
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        console.log("Geri tuşuna basıldı - LeaderboardScreen");
        onBack();
        return true; // Event'i consume et
      }
    );

    return () => {
      console.log("BackHandler temizleniyor - LeaderboardScreen");
      backHandler.remove();
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      console.log("Loading leaderboard for:", playerNickname);
      setHasError(false);

      // Timeout wrapper fonksiyonu
      const loadWithTimeout = async () => {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("Leaderboard yükleme timeout")),
            7000
          );
        });

        return Promise.race([
          FirebaseLeaderboard.getGlobalLeaderboardWithPlayer(playerNickname),
          timeoutPromise,
        ]);
      };

      const data = await loadWithTimeout();

      setTop47(data.top47);
      setPlayerRank(data.playerRank);
      setPlayerScore(data.playerScore);
      setTotalPlayers(data.totalPlayers);
    } catch (error) {
      console.error("Error loading global leaderboard:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [playerNickname]);

  const onRefresh = () => {
    setRefreshing(true);
    setHasError(false); // Yenileme sırasında hata durumunu sıfırla
    loadLeaderboard();
  };

  const renderLeaderboardItem = (
    player: PlayerScore,
    index: number,
    isCurrentPlayer: boolean = false
  ) => {
    const position = index + 1;

    let positionStyle = styles.normalPosition;
    if (position === 1) positionStyle = styles.firstPosition;
    else if (position === 2) positionStyle = styles.secondPosition;
    else if (position === 3) positionStyle = styles.thirdPosition;

    const itemStyle = isCurrentPlayer
      ? [styles.leaderboardItem, styles.currentPlayerItem]
      : styles.leaderboardItem;

    return (
      <View key={player.id} style={itemStyle}>
        <View style={[styles.positionContainer, positionStyle]}>
          <Text style={styles.positionText}>
            {isCurrentPlayer ? playerRank : position}
          </Text>
        </View>

        <View style={styles.playerDetails}>
          <Text
            style={[
              styles.playerNickname,
              isCurrentPlayer && styles.currentPlayerNickname,
            ]}
          >
            {player.nickname}
            {isCurrentPlayer && ` (${t("leaderboard.you")})`}
          </Text>
          <Text style={styles.playerTitleText}>
            {t(getPlayerTitleKey(player.score))}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.playerScore,
              isCurrentPlayer && styles.currentPlayerScore,
            ]}
          >
            {player.score.toLocaleString()}
          </Text>
          <Text style={styles.playerDate}>{player.date}</Text>
        </View>
      </View>
    );
  };

  const renderPlayerSection = () => {
    if (!playerScore || playerRank <= 47) return null;

    return (
      <View style={styles.playerSection}>
        <View style={styles.sectionDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t("leaderboard.yourRank")}</Text>
          <View style={styles.dividerLine} />
        </View>

        {renderLeaderboardItem(playerScore, playerRank - 1, true)}

        <Text style={styles.rankInfo}>
          {t("leaderboard.rankInfo", { rank: playerRank, total: totalPlayers })}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>{t("leaderboard.back")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("leaderboard.title")}</Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d2d3" />
          <Text style={styles.loadingText}>{t("leaderboard.loading")}</Text>
        </View>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>{t("leaderboard.back")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("leaderboard.title")}</Text>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>{t("leaderboard.errorTitle")}</Text>
          <Text style={styles.errorMessage}>
            {t("leaderboard.errorMessage")}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true);
              setHasError(false);
              loadLeaderboard();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>{t("leaderboard.retry")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{t("leaderboard.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("leaderboard.title")}</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00d2d3"]}
            tintColor="#00d2d3"
          />
        }
      >
        <View style={styles.leaderboardContainer}>
          {/* İstatistik Bilgisi */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {t("leaderboard.totalPlayers", { count: totalPlayers })} •{" "}
              {t("leaderboard.top47")}
            </Text>
          </View>

          {/* Top 47 Listesi */}
          {top47.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("leaderboard.noScores")}</Text>
              <Text style={styles.emptySubtext}>
                {t("leaderboard.playFirstGame")}
              </Text>
            </View>
          ) : (
            top47.map((player, index) => {
              const isCurrentPlayer =
                player.nickname.toLowerCase() === playerNickname.toLowerCase();
              return renderLeaderboardItem(player, index, isCurrentPlayer);
            })
          )}

          {/* Kullanıcının kendi sırası (eğer top 47'de değilse) */}
          {renderPlayerSection()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#16213e",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 210, 211, 0.1)",
    borderWidth: 1,
    borderColor: "#00d2d3",
  },
  backButtonText: {
    color: "#00d2d3",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: "#00d2d3",
    textAlign: "center",
    marginRight: 80, // Back button genişliği kadar offset
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: 16,
    marginTop: 15,
  },
  scrollContainer: {
    flex: 1,
  },
  leaderboardContainer: {
    padding: 20,
  },
  statsContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: "#0f3460",
    borderRadius: 8,
  },
  statsText: {
    color: "#00d2d3",
    fontSize: 14,
    fontWeight: "600",
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213e",
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  currentPlayerItem: {
    backgroundColor: "#1e2a4a",
    borderColor: "#00d2d3",
    borderWidth: 2,
  },
  positionContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  normalPosition: {
    backgroundColor: "#0f3460",
  },
  firstPosition: {
    backgroundColor: "#FFD700",
  },
  secondPosition: {
    backgroundColor: "#C0C0C0",
  },
  thirdPosition: {
    backgroundColor: "#CD7F32",
  },
  positionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  playerDetails: {
    flex: 1,
  },
  playerNickname: {
    color: "#00d2d3",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  currentPlayerNickname: {
    color: "#e94560",
  },
  playerTitleText: {
    color: "#e94560",
    fontSize: 12,
    fontWeight: "600",
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  playerScore: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  currentPlayerScore: {
    color: "#00d2d3",
  },
  playerDate: {
    color: "#666",
    fontSize: 10,
  },
  playerSection: {
    marginTop: 30,
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#0f3460",
  },
  dividerText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 15,
  },
  rankInfo: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
    marginTop: 10,
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#666",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  emptySubtext: {
    color: "#444",
    fontSize: 14,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    color: "#e94560",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  errorMessage: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: "#00d2d3",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LeaderboardScreen;
