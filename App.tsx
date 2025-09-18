import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import SupportScreen from "./src/screens/SupportScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "intl-pluralrules";
import { initializeI18n } from "./src/utils/i18n";
import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Platform,
  BackHandler,
  AppState,
} from "react-native";
import GameScreen from "./src/screens/GameScreen";
import MenuScreen from "./src/screens/MenuScreen";
import LeaderboardScreen from "./src/screens/LeaderboardScreen";
import CreditsScreen from "./src/screens/CreditsScreen";
import HowToPlayScreen from "./src/screens/HowToPlayScreen";
import {
  getUserProfile,
  saveUserProfile,
  UserProfile,
} from "./src/utils/StorageUtils";
import SoundManager from "./src/utils/SoundManager";
import IAPManager from "./src/utils/IAPManager";

export type Screen =
  | "menu"
  | "game"
  | "leaderboard"
  | "credits"
  | "support"
  | "howToPlay";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [playerNickname, setPlayerNickname] = useState<string>("");
  const [isCheckingUser, setIsCheckingUser] = useState<boolean>(true);
  const [isI18nReady, setIsI18nReady] = useState<boolean>(false);
  const [gamePaused, setGamePaused] = useState<boolean>(false);
  const handleGamePause = (paused: boolean) => {
    setGamePaused(paused);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // Ses yüklemeyi PARALEL başlatın
        const soundManager = SoundManager.getInstance();
        const soundInitPromise = soundManager.initialize();

        // İlk olarak i18n'i başlat
        await initializeI18n();
        setIsI18nReady(true);

        // GEÇICI: User profile'ı sıfırla (sadece test için)
        // await AsyncStorage.removeItem("@NumPrime_UserProfile");

        // Sonra kullanıcı profilini kontrol et
        const profile = await getUserProfile();
        if (profile && profile.nickname) {
          setPlayerNickname(profile.nickname);
        }
        // Ses yüklemesinin bitmesini bekle
        await soundInitPromise;

        // Menu müziğini hemen başlat
        await soundManager.playMenuMusic();
      } catch (error) {
        console.error("Error initializing app:", error);
        setIsI18nReady(true);
      } finally {
        setIsCheckingUser(false);
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
          return false; // Event'i consume etme, alt seviyeye geçir
        }
      );

      return () => backHandler.remove();
    }
  }, [currentScreen]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      const soundManager = SoundManager.getInstance();

      if (nextAppState === "background" || nextAppState === "inactive") {
        soundManager.pauseMenuMusic();
        if (currentScreen !== "game") {
          soundManager.pauseBackgroundMusic();
        }
      } else if (nextAppState === "active") {
        setTimeout(async () => {
          try {
            if (currentScreen !== "game") {
              await soundManager.ensureMenuMusicPlaying();
            } else {
              // Oyun ekranındaysak VE pause durumu değilse müziği başlatma
              if (!soundManager.isGameCurrentlyPaused()) {
                console.log(
                  "Oyun pause değil - müzik başlatılmıyor (manuel resume gerekli)"
                );
              } else {
                console.log("Oyun pause durumunda - müzik başlatılmıyor");
              }
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
    return () => subscription?.remove();
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

  const handleShowHowToPlay = async () => {
    // Menu müziği çalmaya devam etsin
    setCurrentScreen("howToPlay");
  };

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

    const soundManager = SoundManager.getInstance();
    await soundManager.pauseMenuMusic();
    await soundManager.startGameMusic();

    setCurrentScreen("game");
  };

  const handleGameEnd = async () => {
    const soundManager = SoundManager.getInstance();
    soundManager.cancelPendingBackgroundMusicResume();

    // Oyun bitince pause durumunu sıfırla
    soundManager.setGamePaused(false);

    await soundManager.pauseBackgroundMusic();
    await soundManager.restartMenuMusic();

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
            onShowHowToPlay={handleShowHowToPlay}
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
      case "howToPlay": // YENİ CASE
        return <HowToPlayScreen onBack={handleBackToMenu} />;
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
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        {renderScreen()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
});
