import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useTranslation } from "react-i18next";
import SoundManager from "../utils/SoundManager";

interface HowToPlayScreenProps {
  onBack: () => void;
}

const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const soundManager = SoundManager.getInstance();

  const handleBackPress = async () => {
    await soundManager.playButtonSound();
    onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{t("howToPlay.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("howToPlay.title")}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionTitle}>
              🎯 {t("howToPlay.objective.title")}
            </Text>
            <Text style={styles.instructionText}>
              {t("howToPlay.objective.text")}
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionTitle}>
              🎮 {t("howToPlay.controls.title")}
            </Text>
            <Text style={styles.instructionText}>
              {t("howToPlay.controls.text")}
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionTitle}>
              🔢 {t("howToPlay.blocks.title")}
            </Text>
            <Text style={styles.instructionText}>
              {t("howToPlay.blocks.text")}
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionTitle}>
              💎 {t("howToPlay.primes.title")}
            </Text>
            <Text style={styles.instructionText}>
              {t("howToPlay.primes.text")}
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionTitle}>
              ⚡ {t("howToPlay.quickDrop.title")}
            </Text>
            <Text style={styles.instructionText}>
              {t("howToPlay.quickDrop.text")}
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionTitle}>
              🔥 {t("howToPlay.tips.title")}
            </Text>
            <Text style={styles.instructionText}>
              {t("howToPlay.tips.text")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#16213e",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0, 210, 211, 0.1)",
    borderWidth: 1,
    borderColor: "#00d2d3",
  },
  backButtonText: {
    color: "#00d2d3",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: "#00d2d3",
    textAlign: "center",
    marginRight: 80, // Back button genişliği kadar offset
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  instructionsContainer: {
    padding: 20,
  },
  instructionItem: {
    backgroundColor: "rgba(22, 33, 62, 0.6)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 210, 211, 0.2)",
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00d2d3",
    marginBottom: 12,
    lineHeight: 26,
  },
  instructionText: {
    fontSize: 17,
    color: "#e6e6fa",
    lineHeight: 26,
    textAlign: "justify",
  },
});

export default HowToPlayScreen;
