import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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
import { getTop50WithPlayer } from "../utils/StorageUtils";
import { useTranslation } from "react-i18next";

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
  const [top50, setTop50] = useState<PlayerScore[]>([]);
  const [playerRank, setPlayerRank] = useState<number>(-1);
  const [playerScore, setPlayerScore] = useState<PlayerScore | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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
      const data = await getTop50WithPlayer(playerNickname);
      setTop50(data.top50);
      setPlayerRank(data.playerRank);
      setPlayerScore(data.playerScore);
      setTotalPlayers(data.totalPlayers);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
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
    if (!playerScore || playerRank <= 50) return null;

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
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>{t("leaderboard.back")}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t("leaderboard.title")}</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d2d3" />
          <Text style={styles.loadingText}>{t("leaderboard.loading")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t("leaderboard.back")}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t("leaderboard.title")}</Text>
        <View style={styles.spacer} />
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
              {t("leaderboard.top50")}
            </Text>
          </View>

          {/* Top 50 Listesi */}
          {top50.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("leaderboard.noScores")}</Text>
              <Text style={styles.emptySubtext}>
                {t("leaderboard.playFirstGame")}
              </Text>
            </View>
          ) : (
            top50.map((player, index) => {
              const isCurrentPlayer =
                player.nickname.toLowerCase() === playerNickname.toLowerCase();
              return renderLeaderboardItem(player, index, isCurrentPlayer);
            })
          )}

          {/* Kullanıcının kendi sırası (eğer top 50'de değilse) */}
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#16213e",
    borderBottomWidth: 2,
    borderBottomColor: "#0f3460",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: "#00d2d3",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  spacer: {
    width: 60,
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
});

export default LeaderboardScreen;
