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
} from "react-native";
import SoundManager from "../utils/SoundManager";

interface MenuScreenProps {
  onStartGame: () => void;
  onShowLeaderboard: () => void;
  playerNickname: string;
  setPlayerNickname: (nickname: string) => void;
}

const { width, height } = Dimensions.get("window");

const MenuScreen: React.FC<MenuScreenProps> = ({
  onStartGame,
  onShowLeaderboard,
  playerNickname,
  setPlayerNickname,
}) => {
  const soundManager = SoundManager.getInstance();

  // Menu açıldığında müzik başlat (kaldığı yerden)
  useEffect(() => {
    const startMenuMusic = async () => {
      const soundManager = SoundManager.getInstance();
      await soundManager.playMenuMusic();
    };

    startMenuMusic();
  }, []);
  const [inputNickname, setInputNickname] = useState(playerNickname);

  // iPhone için ekstra margin
  const getTopMargin = () => {
    if (Platform.OS === "ios") {
      // iPhone için çok daha büyük margin
      if (height > 800) return height * 0.2; // iPhone X ve üzeri - %20!
      return height * 0.15; // Eski iPhone'lar
    }
    return height * 0.08; // Android
  };

  const handleStartGame = () => {
    if (!inputNickname.trim()) {
      Alert.alert("Hata", "Lütfen bir kullanıcı adı girin!");
      return;
    }

    if (inputNickname.length < 3) {
      Alert.alert("Hata", "Kullanıcı adı en az 3 karakter olmalı!");
      return;
    }

    setPlayerNickname(inputNickname.trim());
    onStartGame();
  };

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
        <Text style={styles.subtitle}>Mathematical Puzzle Game</Text>

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
          <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
          <TextInput
            style={styles.input}
            value={inputNickname}
            onChangeText={setInputNickname}
            placeholder="Kullanıcı adınızı girin"
            placeholderTextColor="#666"
            maxLength={20}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleStartGame}>
          <Text style={styles.buttonText}>OYUNA BAŞLA</Text>
        </TouchableOpacity>

        {/* Alternative approach - View based button */}
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onShowLeaderboard}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            SKOR TABLOSU
          </Text>
        </TouchableOpacity>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Nasıl Oynanır:</Text>
          <Text style={styles.instructionText}>
            • Düşen sayıları yöneterek yerleştir
          </Text>
          <Text style={styles.instructionText}>
            • Eşit sayılar elde ederek bir araya getir
          </Text>
          <Text style={styles.instructionText}>
            • + veya - işlemlerinden birini seçerek üzerine indiğin bloğu
            değiştirebilirsin
          </Text>
          <Text style={styles.instructionText}>
            • İki eşit asal sayıyı bir araya getirirsen ekstra patlar, tek çift asal sayı olan 2 ise özel patlar
          </Text>
        </View>
      </View>
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
    marginTop: 80, // 20'den 40'a - daha aşağı
    marginBottom: 25, // 30'dan 40'a - daha fazla boşluk
    paddingTop: 15, // 5'ten 15'e - ekstra padding
  },

  // Logo Tasarımı - Küçültülmüş
  logoContainer: {
    marginBottom: 20, // 15'ten 20'ye - logo ile subtitle arası
  },
  logoBackground: {
    backgroundColor: "#16213e",
    paddingHorizontal: 20, // 30'dan 20'ye
    paddingVertical: 12, // 20'den 12'ye
    borderRadius: 15, // 20'den 15'e
    borderWidth: 2, // 3'ten 2'ye
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
    color: "#00d2d3",
    textShadowColor: "rgba(0, 210, 211, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  logoPrime: {
    color: "#e94560",
    textShadowColor: "rgba(233, 69, 96, 0.8)",
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
    marginBottom: 15,
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
  buttonTextContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  secondaryButtonText: {
    color: "#00d2d3",
    fontFamily: Platform.OS === "android" ? "sans-serif" : "System", // Platform specific font
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
      elevation: 0, // Remove elevation
    }),
    // textShadowColor'ı son olarak set et
    textShadowColor: "transparent",
  },
  instructions: {
    marginTop: 40,
    alignItems: "center",
    backgroundColor: "#0f3460",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#16213e",
  },
  instructionTitle: {
    fontSize: 18,
    color: "#00d2d3",
    fontWeight: "bold",
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default MenuScreen;
