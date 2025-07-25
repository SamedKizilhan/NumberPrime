import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageChange,
}) => {
  const { i18n } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.languageButton,
          i18n.language === "tr" && styles.activeButton,
        ]}
        onPress={() => changeLanguage("tr")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.languageText,
            i18n.language === "tr" && styles.activeText,
          ]}
        >
          🇹🇷 TR
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.languageButton,
          i18n.language === "en" && styles.activeButton,
        ]}
        onPress={() => changeLanguage("en")}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.languageText,
            i18n.language === "en" && styles.activeText,
          ]}
        >
          🇺🇸 EN
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#16213e",
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#00d2d3",
  },
  languageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  activeText: {
    color: "#1a1a2e",
  },
});

export default LanguageSelector;
