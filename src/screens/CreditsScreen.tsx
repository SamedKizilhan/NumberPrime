import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Dimensions,
} from "react-native";

interface CreditsScreenProps {
  onBack: () => void;
}

const { width, height } = Dimensions.get("window");

const CreditsScreen: React.FC<CreditsScreenProps> = ({ onBack }) => {
  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Hata", "URL açılamadı");
      }
    } catch (error) {
      Alert.alert("Hata", "Bağlantı açılırken bir hata oluştu");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Müzikler ve Atıflar</Text>
        <Text style={styles.subtitle}>Kullanılan sesler için teşekkürler</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Oyun Müziği */}
        <View style={styles.musicCard}>
          <View style={styles.musicHeader}>
            <Text style={styles.musicTitle}>🎮 Oyun Müziği</Text>
            <Text style={styles.fileName}>background.mp3</Text>
          </View>

          <View style={styles.musicInfo}>
            <Text style={styles.soundName}>Game Theme #4</Text>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openUrl("https://freesound.org/people/tyops/")}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>👤 Yapımcı: tyops</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl("https://freesound.org/people/tyops/sounds/423805/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>🔗 Orijinal Ses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.licenseButton}
              onPress={() =>
                openUrl("https://creativecommons.org/licenses/by/4.0/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.licenseText}>📜 Lisans: Attribution 4.0</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menü Müziği */}
        <View style={styles.musicCard}>
          <View style={styles.musicHeader}>
            <Text style={styles.musicTitle}>🎵 Menü Müziği</Text>
            <Text style={styles.fileName}>MenuScreenMusic.mp3</Text>
          </View>

          <View style={styles.musicInfo}>
            <Text style={styles.soundName}>80s Loop #4</Text>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openUrl("https://freesound.org/people/danlucaz/")}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>👤 Yapımcı: danlucaz</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl("https://freesound.org/people/danlucaz/sounds/514178/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>🔗 Orijinal Ses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.licenseButton}
              onPress={() =>
                openUrl("http://creativecommons.org/publicdomain/zero/1.0/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.licenseText}>
                📜 Lisans: Creative Commons 0
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Oyun Bitiş Müziği */}
        <View style={styles.musicCard}>
          <View style={styles.musicHeader}>
            <Text style={styles.musicTitle}>⏰ Oyun Bitiş Müziği</Text>
            <Text style={styles.fileName}>failure.mp3</Text>
          </View>

          <View style={styles.musicInfo}>
            <Text style={styles.soundName}>timer ends_time up.wav</Text>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openUrl("https://freesound.org/people/MakoFox/")}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>👤 Yapımcı: MakoFox</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl("https://freesound.org/people/MakoFox/sounds/126426/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>🔗 Orijinal Ses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.licenseButton}
              onPress={() =>
                openUrl("https://creativecommons.org/licenses/by/4.0/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.licenseText}>📜 Lisans: Attribution 4.0</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Normal Patlama Müziği */}
        <View style={styles.musicCard}>
          <View style={styles.musicHeader}>
            <Text style={styles.musicTitle}>💥 Normal Patlama</Text>
            <Text style={styles.fileName}>explosion.mp3</Text>
          </View>

          <View style={styles.musicInfo}>
            <Text style={styles.soundName}>UI_POP_UP.mp3</Text>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openUrl("https://freesound.org/people/Marevnik/")}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>👤 Yapımcı: Marevnik</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl("https://freesound.org/people/Marevnik/sounds/708605/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>🔗 Orijinal Ses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.licenseButton}
              onPress={() =>
                openUrl("https://creativecommons.org/licenses/by/4.0/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.licenseText}>📜 Lisans: Attribution 4.0</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Combo Müziği */}
        <View style={styles.musicCard}>
          <View style={styles.musicHeader}>
            <Text style={styles.musicTitle}>🌟 Combo Müziği</Text>
            <Text style={styles.fileName}>combo.mp3</Text>
          </View>

          <View style={styles.musicInfo}>
            <Text style={styles.soundName}>Jingle_Win_Synth_02.wav</Text>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl("https://freesound.org/people/LittleRobotSoundFactory/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                👤 Yapımcı: LittleRobotSoundFactory
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl(
                  "https://freesound.org/people/LittleRobotSoundFactory/sounds/274178/"
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>🔗 Orijinal Ses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.licenseButton}
              onPress={() =>
                openUrl("https://creativecommons.org/licenses/by/4.0/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.licenseText}>📜 Lisans: Attribution 4.0</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Asal 2 Patlaması */}
        <View style={styles.musicCard}>
          <View style={styles.musicHeader}>
            <Text style={styles.musicTitle}>✨ Asal 2 Patlaması</Text>
            <Text style={styles.fileName}>prime2.mp3</Text>
          </View>

          <View style={styles.musicInfo}>
            <Text style={styles.soundName}>Retro video game sfx - Bonus</Text>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openUrl("https://freesound.org/people/OwlStorm/")}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>👤 Yapımcı: OwlStorm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl("https://freesound.org/people/OwlStorm/sounds/404770/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>🔗 Orijinal Ses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.licenseButton}
              onPress={() =>
                openUrl("http://creativecommons.org/publicdomain/zero/1.0/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.licenseText}>
                📜 Lisans: Creative Commons 0
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Asal Sayı Patlaması */}
        <View style={styles.musicCard}>
          <View style={styles.musicHeader}>
            <Text style={styles.musicTitle}>🔥 Asal Sayı Patlaması</Text>
            <Text style={styles.fileName}>prime_explosion.mp3</Text>
          </View>

          <View style={styles.musicInfo}>
            <Text style={styles.soundName}>Explosion_04.wav</Text>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl("https://freesound.org/people/LittleRobotSoundFactory/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                👤 Yapımcı: LittleRobotSoundFactory
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl(
                  "https://freesound.org/people/LittleRobotSoundFactory/sounds/270310/"
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>🔗 Orijinal Ses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.licenseButton}
              onPress={() =>
                openUrl("https://creativecommons.org/licenses/by/4.0/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.licenseText}>📜 Lisans: Attribution 4.0</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hareket Sesleri */}
        <View style={styles.musicCard}>
          <View style={styles.musicHeader}>
            <Text style={styles.musicTitle}>🎯 Hareket Sesleri</Text>
            <Text style={styles.fileName}>move.mp3 (Sağ/Sol Oklar)</Text>
          </View>

          <View style={styles.musicInfo}>
            <Text style={styles.soundName}>move.mp3</Text>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => openUrl("https://freesound.org/people/bsp7176/")}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>👤 Yapımcı: bsp7176</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl("https://freesound.org/people/bsp7176/sounds/570635/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>🔗 Orijinal Ses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.licenseButton}
              onPress={() =>
                openUrl("http://creativecommons.org/publicdomain/zero/1.0/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.licenseText}>
                📜 Lisans: Creative Commons 0
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buton Sesleri */}
        <View style={styles.musicCard}>
          <View style={styles.musicHeader}>
            <Text style={styles.musicTitle}>🔘 Buton Sesleri</Text>
            <Text style={styles.fileName}>button.mp3 (+/- ve Pause)</Text>
          </View>

          <View style={styles.musicInfo}>
            <Text style={styles.soundName}>Monophonic Twist 03.wav</Text>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl("https://freesound.org/people/ironcross32/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>👤 Yapımcı: ironcross32</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                openUrl(
                  "https://freesound.org/people/ironcross32/sounds/582674/"
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>🔗 Orijinal Ses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.licenseButton}
              onPress={() =>
                openUrl("http://creativecommons.org/publicdomain/zero/1.0/")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.licenseText}>
                📜 Lisans: Creative Commons 0
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Teşekkür Mesajı */}
        <View style={styles.thanksCard}>
          <Text style={styles.thanksTitle}>🙏 Teşekkürler</Text>
          <Text style={styles.thanksText}>
            Bu oyunun müzik ve ses efektleri Freesound.org topluluğundan
            alınmıştır. Seslerini bizimle paylaştıkları için tüm yaratıcılara
            teşekkür ederiz.
          </Text>

          <TouchableOpacity
            style={styles.freesoundButton}
            onPress={() => openUrl("https://freesound.org")}
            activeOpacity={0.7}
          >
            <Text style={styles.freesoundText}>
              🌐 Freesound.org'u Ziyaret Et
            </Text>
          </TouchableOpacity>
        </View>

        {/* Oyun Bilgileri */}
        <View style={styles.gameInfoCard}>
          <Text style={styles.gameInfoTitle}>🎯 NumPrime</Text>
          <Text style={styles.gameInfoText}>Mathematical Puzzle Game</Text>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Back Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← GERİ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },

  // Header
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#a0a0a0",
    textAlign: "center",
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Music Cards
  musicCard: {
    backgroundColor: "#16213e",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#0f4c75",
  },
  musicHeader: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#0f4c75",
    paddingBottom: 12,
  },
  musicTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3282b8",
    marginBottom: 5,
  },
  fileName: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  musicInfo: {
    gap: 12,
  },
  soundName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },

  // Link Buttons
  linkButton: {
    backgroundColor: "#0f4c75",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3282b8",
  },
  linkText: {
    color: "#3282b8",
    fontSize: 14,
    fontWeight: "500",
  },
  licenseButton: {
    backgroundColor: "#2d5a27",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  licenseText: {
    color: "#4caf50",
    fontSize: 14,
    fontWeight: "500",
  },

  // Thanks Card
  thanksCard: {
    backgroundColor: "#2d1b3d",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#8e44ad",
  },
  thanksTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8e44ad",
    marginBottom: 12,
    textAlign: "center",
  },
  thanksText: {
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 15,
  },
  freesoundButton: {
    backgroundColor: "#8e44ad",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: "center",
  },
  freesoundText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Game Info Card
  gameInfoCard: {
    backgroundColor: "#1a2332",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#34495e",
  },
  gameInfoTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3282b8",
    marginBottom: 5,
  },
  gameInfoText: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 5,
  },
  versionText: {
    fontSize: 12,
    color: "#888",
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
  backButton: {
    backgroundColor: "#0f4c75",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3282b8",
  },
  backButtonText: {
    color: "#3282b8",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default CreditsScreen;
