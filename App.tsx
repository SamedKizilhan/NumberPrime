import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, SafeAreaView } from "react-native";
import GameScreen from "./src/screens/GameScreen";
import MenuScreen from "./src/screens/MenuScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import { getUserProfile, saveUserProfile, UserProfile } from './src/utils/StorageUtils';

export type Screen = "menu" | "game" | "leaderboard";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [playerNickname, setPlayerNickname] = useState<string>("");
  const [isCheckingUser, setIsCheckingUser] = useState<boolean>(true);

  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (profile && profile.nickname) {
          setPlayerNickname(profile.nickname);
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      } finally {
        setIsCheckingUser(false);
      }
    };

    checkUserProfile();
  }, []);

  const handleNicknameSet = async (nickname: string) => {
    const profile: UserProfile = {
      nickname: nickname,
      isFirstTime: false,
      totalGamesPlayed: 0,
      bestScore: 0
    };

    await saveUserProfile(profile);
    setPlayerNickname(nickname);
  };

  const renderScreen = () => {
    // Kullanıcı kontrolü devam ediyorsa loading göster
    if (isCheckingUser) {
      return null; // Veya bir loading screen komponenti
    }

    switch (currentScreen) {
      case "menu":
        return (
          <MenuScreen
            onStartGame={() => setCurrentScreen("game")}
            onShowLeaderboard={() => setCurrentScreen("leaderboard")}
            playerNickname={playerNickname}
            setPlayerNickname={handleNicknameSet}
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
        return (
          <LeaderboardScreen 
            onBack={() => setCurrentScreen("menu")} 
            playerNickname={playerNickname}
          />
        );
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