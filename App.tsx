import SupportScreen from "./src/screens/SupportScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "intl-pluralrules";
import { initializeI18n } from "./src/utils/i18n";
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
import CreditsScreen from "./src/screens/CreditsScreen";
import {
  getUserProfile,
  saveUserProfile,
  UserProfile,
} from "./src/utils/StorageUtils";
import SoundManager from "./src/utils/SoundManager";
import IAPManager from "./src/utils/IAPManager";

export type Screen = "menu" | "game" | "leaderboard" | "credits" | "support";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [playerNickname, setPlayerNickname] = useState<string>("");
  const [isCheckingUser, setIsCheckingUser] = useState<boolean>(true);
  const [isI18nReady, setIsI18nReady] = useState<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // İlk olarak i18n'i başlat
        await initializeI18n();
        setIsI18nReady(true);

        // GEÇICI: User profile'ı sıfırla (sadece test için)
        // await AsyncStorage.removeItem("@NumPrime_UserProfile");
        // console.log("User profile resetlendi");

        // Sonra kullanıcı profilini kontrol et
        const profile = await getUserProfile();
        if (profile && profile.nickname) {
          setPlayerNickname(profile.nickname);
        }
      } catch (error) {
        console.error("Error initializing app:", error);
        setIsI18nReady(true); // Hata durumunda da devam et
      } finally {
        setIsCheckingUser(false);

        // SoundManager'ı initialize et ve menu müziğini başlat
        const initializeSound = async () => {
          const soundManager = SoundManager.getInstance();
          await soundManager.initialize();
          await soundManager.playMenuMusic();
        };

        initializeSound();
      }
    };

    initialize();
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
      const soundManager = SoundManager.getInstance();

      if (nextAppState === "background" || nextAppState === "inactive") {
        console.log("🔴 App going to background - pausing music");
        soundManager.pauseBackgroundMusic();
        soundManager.pauseMenuMusic();
      } else if (nextAppState === "active") {
        console.log(
          "🟢 App becoming active - resuming music for screen:",
          currentScreen
        );

        setTimeout(async () => {
          try {
            if (currentScreen === "game") {
              await soundManager.safePlayBackgroundMusic();
            } else {
              await soundManager.ensureMenuMusicPlaying();
            }
          } catch (error) {
            console.log("Music resume error:", error);
          }
        }, 500);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
      console.log("App.tsx: AppState subscription temizlendi");
    };
  }, [currentScreen]);

  // Uygulama gerçekten kapanırken cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      const soundManager = SoundManager.getInstance();
      soundManager.cleanup(); // fullCleanup() değil!

      const iapManager = IAPManager.getInstance();
      iapManager.cleanup();
    };

    // Sadece gerçek app close için
    return handleBeforeUnload;
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

  const handleGameStart = async (nickname?: string) => {
    if (nickname && nickname.trim()) {
      await handleNicknameSet(nickname.trim());
    }

    // Menu müziğini durdur ve oyun müziğini başlat
    const soundManager = SoundManager.getInstance();
    await soundManager.pauseMenuMusic();
    await soundManager.startGameMusic();

    setCurrentScreen("game");
  };

  const handleGameEnd = async () => {
    // Oyun müziğini durdur ve menu müziğini başlat
    const soundManager = SoundManager.getInstance();
    soundManager.cancelPendingBackgroundMusicResume();
    await soundManager.pauseBackgroundMusic();
    await soundManager.playMenuMusic();

    setCurrentScreen("menu");
  };

  const handleLeaderboard = async () => {
    // Menu müziği çalmaya devam etsin
    setCurrentScreen("leaderboard");
  };

  const handleShowCredits = async () => {
    // Menu müziği çalmaya devam etsin
    setCurrentScreen("credits");
  };

  const handleBackToMenu = async () => {
    // Menu ekranlarından menu'ye dönerken menu müziği devam etsin
    const soundManager = SoundManager.getInstance();
    await soundManager.ensureMenuMusicPlaying();
    setCurrentScreen("menu");
  };

  const renderScreen = () => {
    // i18n veya kullanıcı kontrolü devam ediyorsa loading göster
    if (!isI18nReady || isCheckingUser) {
      return null; // Veya bir loading screen komponenti
    }

    switch (currentScreen) {
      case "menu":
        return (
          <MenuScreen
            onStartGame={handleGameStart}
            onShowLeaderboard={handleLeaderboard}
            onShowCredits={handleShowCredits}
            onShowSupport={handleShowSupport}
            playerNickname={playerNickname}
            setPlayerNickname={handleNicknameSet}
          />
        );
      case "game":
        return (
          <GameScreen
            onGameEnd={handleGameEnd}
            playerNickname={playerNickname}
          />
        );
      case "leaderboard":
        return (
          <LeaderboardScreen
            onBack={handleBackToMenu}
            playerNickname={playerNickname}
          />
        );
      case "support":
        return <SupportScreen onBack={handleBackToMenu} />;
      case "credits":
        return <CreditsScreen onBack={handleBackToMenu} />;
      default:
        return null;
    }
  };

  const handleShowSupport = async () => {
    // Menu müziği çalmaya devam etsin
    setCurrentScreen("support");
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
