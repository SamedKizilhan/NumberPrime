import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { FallingBlock } from "../types/GameTypes";
import { isPrime } from "../utils/GameUtils";

interface GameHeaderProps {
  score: number;
  level: number;
  playerNickname: string;
  playerTitle: string;
  nextBlock: FallingBlock; // Yeni prop
  onPause: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  score,
  level,
  playerNickname,
  playerTitle,
  nextBlock, // Yeni prop
  onPause,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Sol taraf - Player bilgileri */}
      <View style={styles.leftSection}>
        <Text style={styles.playerName} numberOfLines={1}>
          {playerNickname}
        </Text>
        <Text style={styles.playerTitle} numberOfLines={1}>
          {playerTitle}
        </Text>
      </View>

      {/* Orta - Next Block Preview */}
      <View style={styles.centerSection}>
        <Text style={styles.nextLabel}>{t("game.nextBlock")}</Text>
        <View
          style={[
            styles.nextBlockContainer,
            isPrime(nextBlock.value) ? styles.primeBlock : styles.normalBlock,
          ]}
        >
          <Text style={styles.nextBlockValue}>{nextBlock.value}</Text>
        </View>
      </View>

      {/* Sağ taraf - Score ve Level */}
      <View style={styles.rightSection}>
        <Text style={styles.scoreText}>{score}</Text>
        <Text style={styles.levelText}>
          {t("game.level")} {level}
        </Text>
      </View>

      {/* Pause Button - Tam sağ üstte */}
      <TouchableOpacity style={styles.pauseButton} onPress={onPause}>
        <Text style={styles.pauseText}>{t("game.pause")}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#16213e",
    borderBottomWidth: 2,
    borderBottomColor: "#0f3460",
    position: "relative",
    minHeight: 80,
  },
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerSection: {
    alignItems: "center",
    paddingHorizontal: 15,
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  playerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    maxWidth: 120,
  },
  playerTitle: {
    color: "#00d2d3",
    fontSize: 12,
    fontWeight: "500",
    maxWidth: 120,
  },
  scoreText: {
    color: "#ffd700",
    fontSize: 20,
    fontWeight: "bold",
  },
  levelText: {
    color: "#a0a0a0",
    fontSize: 12,
    fontWeight: "500",
  },
  nextLabel: {
    color: "#a0a0a0",
    fontSize: 10,
    fontWeight: "500",
    marginBottom: 4,
  },
  nextBlockContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  primeBlock: {
    backgroundColor: "#00d2d3",
    borderColor: "#00a8aa",
    shadowColor: "#00d2d3",
  },
  normalBlock: {
    backgroundColor: "#e94560",
    borderColor: "#d63447",
    shadowColor: "#e94560",
  },
  nextBlockValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pauseButton: {
    position: "absolute",
    right: 15,
    top: 12,
    backgroundColor: "rgba(0, 210, 211, 0.1)",
    borderWidth: 1,
    borderColor: "#00d2d3",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pauseText: {
    color: "#00d2d3",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default GameHeader;
