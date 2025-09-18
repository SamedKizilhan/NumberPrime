import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import SoundManager from "../utils/SoundManager";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
import { FirebaseLeaderboard } from "../utils/FirebaseLeaderboard";

interface MenuScreenProps {
  onStartGame: () => void;
  onShowLeaderboard: () => void;
  onShowCredits: () => void;
  onShowSupport: () => void;
  onShowHowToPlay: () => void;
  playerNickname: string;
  setPlayerNickname: (nickname: string) => void;
}

const { width, height } = Dimensions.get("window");

const MenuScreen: React.FC<MenuScreenProps> = ({
  onStartGame,
  onShowLeaderboard,
  onShowCredits,
  onShowSupport,
  onShowHowToPlay,
  playerNickname,
  setPlayerNickname,
}) => {
  const { t } = useTranslation();
  const soundManager = SoundManager.getInstance();
  const [inputNickname, setInputNickname] = useState<string>("");
  const [isNicknameSet, setIsNicknameSet] = useState<boolean>(false);
  const [animationValue] = useState(new Animated.Value(0));
  const [isLoadingGameSounds, setIsLoadingGameSounds] = useState(false);

  // Menu açıldığında müzik başlat (kaldığı yerden)
  useEffect(() => {
    const startMenuMusic = async () => {
      const soundManager = SoundManager.getInstance();
      await soundManager.ensureMenuMusicPlaying();
    };

    startMenuMusic();
  }, []);

  useEffect(() => {
    if (playerNickname && playerNickname.trim().length >= 3) {
      setIsNicknameSet(true);
      setInputNickname(playerNickname);
    } else {
      setIsNicknameSet(false);
      setInputNickname("");
    }
  }, [playerNickname]);

  // iPhone için ekstra margin
  const getTopMargin = () => {
    if (Platform.OS === "ios") {
      // iPhone için çok daha büyük margin
      if (height > 800) return height * 0.2; // iPhone X ve üzeri - %20!
      return height * 0.15; // Eski iPhone'lar
    }
    return height * 0.08; // Android
  };
  // Test fonksiyonu ekleyin (geçici)
  const testFirebase = async () => {
    try {
      // 5 saniye timeout ekleyelim
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firebase timeout")), 5000)
      );

      const firebaseTest = FirebaseLeaderboard.checkNicknameExists("test");

      const result = await Promise.race([firebaseTest, timeout]);
    } catch (error) {
      console.error(
        "Firebase test error:",
        error instanceof Error ? error.message : error
      );
    }
  };

  const handleStartGame = async () => {
    if (isNicknameSet && playerNickname) {
      // Tüm sesler hazır mı kontrol et
      const soundManager = SoundManager.getInstance();

      if (!soundManager.isFullyReady()) {
        setIsLoadingGameSounds(true);

        try {
          // Tüm sesler yüklenene kadar bekle
          await soundManager.ensureAllSoundsReady();
          setIsLoadingGameSounds(false);

          // Oyunu başlat
          onStartGame();
        } catch (error) {
          setIsLoadingGameSounds(false);
          Alert.alert(
            "Hata",
            "Ses dosyaları yüklenemedi. Oyun sessiz başlayacak."
          );
          onStartGame();
        }
      } else {
        // Tüm sesler hazır, direkt başlat
        onStartGame();
      }
      return;
    }

    // Yeni kullanıcı kaydı
    if (!inputNickname || inputNickname.trim().length < 3) {
      Alert.alert(t("alerts.error"), t("alerts.userNameTooShort"));
      return;
    }

    const nickname = inputNickname.trim();

    try {
      const nicknameExists = await FirebaseLeaderboard.checkNicknameExists(
        nickname
      );
      if (nicknameExists) {
        Alert.alert(
          t("alerts.error"),
          "Bu kullanıcı adı daha önce alınmış! Lütfen farklı bir isim seçin."
        );
        return;
      }

      const registered = await FirebaseLeaderboard.registerPlayer(nickname);
      if (!registered) {
        Alert.alert(
          t("alerts.error"),
          "Kullanıcı kaydı yapılamadı. Lütfen tekrar deneyin."
        );
        return;
      }

      setPlayerNickname(nickname);
      setIsNicknameSet(true);
      onStartGame();
    } catch (error) {
      console.error("Firebase error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Bilinmeyen hata";
      Alert.alert("Hata", "Firebase bağlantı hatası: " + errorMessage);
    }
  };

  const rotateIcon = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Ana Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Text style={styles.logoText}>
              <Text style={styles.logoNum}>Num</Text>
              <Text style={styles.logoPrime}>Prime</Text>
            </Text>
            <View style={styles.logoUnderline} />
          </View>
        </View>

        {/* Alt yazı */}
        <Text style={styles.subtitle}>{t("menu.subtitle")}</Text>

        {/* Asal sayı vurgusu */}
        <View style={styles.primeNumbers}>
          <Text style={styles.primeNumber}>2</Text>
          <Text style={styles.primeNumber}>3</Text>
          <Text style={styles.primeNumber}>5</Text>
          <Text style={styles.primeNumber}>7</Text>
          <Text style={styles.primeNumber}>11</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          {!isNicknameSet ? (
            // Yeni kullanıcı - TextInput göster
            <>
              <Text style={styles.inputLabel}>{t("menu.userNameLabel")}</Text>
              <TextInput
                style={styles.input}
                value={inputNickname}
                onChangeText={setInputNickname}
                placeholder={t("menu.userNamePlaceholder")}
                placeholderTextColor="#666"
                maxLength={20}
                autoCapitalize="none"
              />
            </>
          ) : (
            // Kayıtlı kullanıcı - Hoşgeldin mesajı
            <Text style={styles.welcomeText}>
              {t("menu.welcome", { name: playerNickname })}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.startButton, isLoadingGameSounds && { opacity: 0.6 }]}
          onPress={handleStartGame}
          disabled={isLoadingGameSounds}
          activeOpacity={0.7}
        >
          <Text style={styles.startButtonText}>
            {isNicknameSet ? t("menu.startGame") : t("menu.saveAndStart")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onShowLeaderboard}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {t("menu.leaderboard")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onShowCredits}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {t("menu.music")}
          </Text>
        </TouchableOpacity>

        {/* Nasıl Oynanır Accordion */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            styles.instructionsToggle,
          ]}
          onPress={onShowHowToPlay} // toggleInstructions yerine
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {t("menu.howToPlay")}
          </Text>
        </TouchableOpacity>

        {/* Dil Seçici - Nasıl Oynanır butonunun altında - SABİT KONUM */}
        <View style={styles.bottomControls}>
          <View style={styles.languageContainer}>
            <LanguageSelector />
          </View>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={onShowSupport}
            activeOpacity={0.7}
          >
            <Text style={styles.supportButtonText}>❤️ {t("menu.support")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoadingGameSounds && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#00d2d3" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 50,
    marginBottom: 20,
    paddingTop: 10,
  },

  // Logo Tasarımı - Küçültülmüş
  logoContainer: {
    marginBottom: 15,
  },
  logoBackground: {
    backgroundColor: "#16213e",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#00d2d3",
    shadowColor: "#00d2d3",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4, // 0.6'dan 0.4'e
    shadowRadius: 10, // 15'ten 10'a
    elevation: 10, // 15'ten 10'a
  },
  logoText: {
    fontSize: 36, // 48'den 36'ya - %25 küçük
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1, // 2'den 1'e
  },
  logoNum: {
    color: "#e94560", //e94560
    textShadowColor: "rgba(233, 69, 96, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  logoPrime: {
    color: "#00d2d3",
    textShadowColor: "rgba(0, 210, 211, 0.8)", //rgba(0, 210, 211, 0.8)
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  logoUnderline: {
    height: 4,
    backgroundColor: "#00d2d3",
    marginTop: 8,
    borderRadius: 2,
    shadowColor: "#00d2d3",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    fontStyle: "italic",
    marginBottom: 10,
  },

  // Asal sayı dekorasyonu - Küçültülmüş
  primeNumbers: {
    flexDirection: "row",
    gap: 10, // 15'ten 10'a
  },
  primeNumber: {
    fontSize: 16, // 18'den 16'ya
    color: "#e94560",
    fontWeight: "bold",
    backgroundColor: "#0f3460",
    paddingHorizontal: 10, // 12'den 10'a
    paddingVertical: 5, // 6'dan 5'e
    borderRadius: 10, // 12'den 10'a
    borderWidth: 1,
    borderColor: "#e94560",
    overflow: "hidden",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? -10 : 0, // iOS için yukarı çek
    position: "relative", // Z-index için gerekli
  },
  inputContainer: {
    width: "100%",
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    color: "#e94560",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#16213e",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#0f3460",
  },
  button: {
    backgroundColor: "#e94560",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: "80%",
    alignItems: "center",
    shadowColor: "#e94560",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#00d2d3",
    shadowColor: "#00d2d3",
    overflow: "hidden",
    ...(Platform.OS === "android" && {
      elevation: 0, // Android elevation'ı kaldır
      borderBottomWidth: 2,
      borderBottomColor: "#00d2d3",
    }),
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  secondaryButtonText: {
    color: "#00d2d3",
    fontFamily: Platform.OS === "android" ? "sans-serif" : "System",
    textDecorationLine: "none",
    textDecorationColor: "transparent",
    textDecorationStyle: "solid",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    borderBottomWidth: 0,
    borderWidth: 0,
    ...(Platform.OS === "android" && {
      textAlignVertical: "center",
      includeFontPadding: false,
      elevation: 0,
    }),
    textShadowColor: "transparent",
  },

  // Accordion Styles
  instructionsToggle: {
    // Diğer butonlarla aynı stil, sadece z-index eklendi
    zIndex: 2, // Overlay'in üstünde kalması için
  },
  instructionsOverlay: {
    position: "absolute",
    top: 75, // Toggle butonunun hemen altından başlasın
    left: 0,
    right: 0,
    width: "100%",
    overflow: "hidden",
    zIndex: 999,
    elevation: 999,
  },
  instructions: {
    backgroundColor: "#0f3460",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#16213e",
    elevation: 999,
  },
  instructionText: {
    fontSize: 15,
    color: "#999",
    marginBottom: 8,
    textAlign: "left",
    lineHeight: 20,
  },

  // Dil seçici - altta konumlandırıldı ve SABİT
  languageContainer: {
    marginRight: 15,
  },
  userNameLabel: {
    fontSize: 16,
    color: "#00d2d3",
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },

  userNameInput: {
    borderWidth: 2,
    borderColor: "#00d2d3",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#16213e",
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "600",
  },

  startButton: {
    backgroundColor: "#00d2d3",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 20,
    width: "80%",
    elevation: 5,
    shadowColor: "#00d2d3",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: "relative",
    zIndex: 0,
  },

  startButtonText: {
    color: "#1a1a2e",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },

  welcomeText: {
    fontSize: 20,
    color: "#00d2d3",
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    backgroundColor: "#16213e",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#00d2d3",
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 10,
    zIndex: 0,
  },
  supportButton: {
    backgroundColor: "#16213e",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2.5,
    borderColor: "#e94560",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 15,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e94560",
  },
  instructionsBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.3)", // arka planı koyulaştırmak istersen
    justifyContent: "flex-end", // paneli altta konumlandır
    zIndex: 9999, // her şeyin üstünde olsun
  },
  loadingContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26, 26, 46, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    color: "#00d2d3",
    fontSize: 18,
    marginTop: 20,
    fontWeight: "600",
  },
});

export default MenuScreen;
