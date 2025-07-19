import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface GameHeaderProps {
  score: number;
  level: number;
  playerNickname: string;
  playerTitle: string;
  onPause: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  score,
  level,
  playerNickname,
  playerTitle,
  onPause,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{playerNickname}</Text>
        <Text style={styles.playerTitle}>{playerTitle}</Text>
      </View>

      <View style={styles.gameInfo}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>SKOR</Text>
          <Text style={styles.statValue}>{score.toLocaleString()}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>SEVİYE</Text>
          <Text style={styles.statValue}>{level}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.pauseButton}
        onPress={onPause}
        activeOpacity={0.7}
      >
        <Text style={styles.pauseButtonText}>⏸</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#16213e",
    borderBottomWidth: 2,
    borderBottomColor: "#0f3460",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: "#00d2d3",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  playerTitle: {
    color: "#e94560",
    fontSize: 12,
    fontWeight: "600",
  },
  gameInfo: {
    flexDirection: "row",
    gap: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e94560",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
  },
  pauseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default GameHeader;
