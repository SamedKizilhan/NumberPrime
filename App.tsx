import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, SafeAreaView } from "react-native";
import GameScreen from "./src/screens/GameScreen";
import MenuScreen from "./src/screens/MenuScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";

export type Screen = "menu" | "game" | "leaderboard";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [playerNickname, setPlayerNickname] = useState<string>("");

  const renderScreen = () => {
    switch (currentScreen) {
      case "menu":
        return (
          <MenuScreen
            onStartGame={() => setCurrentScreen("game")}
            onShowLeaderboard={() => setCurrentScreen("leaderboard")}
            playerNickname={playerNickname}
            setPlayerNickname={setPlayerNickname}
          />
        );
      case "game":
        return (
          <GameScreen
            onGameEnd={() => setCurrentScreen("menu")}
            playerNickname={playerNickname}
          />
        );
      case "leaderboard":
        return <LeaderboardScreen onBack={() => setCurrentScreen("menu")} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
});
