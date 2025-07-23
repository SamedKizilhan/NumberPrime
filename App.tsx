import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  SafeAreaView,
  View,
  Platform,
  BackHandler,
  AppState,
} from "react-native";
import GameScreen from "./src/screens/GameScreen";
import MenuScreen from "./src/screens/MenuScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import {
  getUserProfile,
  saveUserProfile,
  UserProfile,
} from "./src/utils/StorageUtils";
import SoundManager from "./src/utils/SoundManager";

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
        console.error("Error checking user profile:", error);
      } finally {
        setIsCheckingUser(false);
      }
    };

    checkUserProfile();
  }, []);

  // Global BackHandler - sadece debug için
  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          console.log(
            `GLOBAL: Geri tuşuna basıldı, current screen: ${currentScreen}`
          );
          return false; // Event'i consume etme, alt seviyeye geçir
        }
      );

      return () => backHandler.remove();
    }
  }, [currentScreen]);

  // SoundManager cleanup - uygulama kapanırken
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        // Uygulama arka plana geçince müziği durdur
        const soundManager = SoundManager.getInstance();
        soundManager.pauseBackgroundMusic();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Component unmount olduğunda (uygulama tamamen kapanırken)
    return () => {
      subscription?.remove();
      const soundManager = SoundManager.getInstance();
      soundManager.fullCleanup();
      console.log("App.tsx: SoundManager tamamen temizlendi");
    };
  }, []);

  const handleNicknameSet = async (nickname: string) => {
    const profile: UserProfile = {
      nickname: nickname,
      isFirstTime: false,
      totalGamesPlayed: 0,
      bestScore: 0,
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

  // Platform specific container
  const Container = Platform.OS === "ios" ? SafeAreaView : View;

  return (
    <Container style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    // Android için ek paddingTop
    ...(Platform.OS === "android" && {
      paddingTop: 25, // Status bar için
    }),
  },
});
