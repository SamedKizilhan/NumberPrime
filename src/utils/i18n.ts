import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Dil dosyalarını import et
import trCommon from "../locales/tr/common.json";
import enCommon from "../locales/en/common.json";

const LANGUAGE_KEY = "@NumPrime_Language";

// Varsayılan dil
const DEFAULT_LANGUAGE = "tr";

// Mevcut dillerin listesi
export const supportedLanguages = ["tr", "en"];

// Dil tercihini kaydet
export const saveLanguagePreference = async (
  language: string
): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error("Error saving language preference:", error);
  }
};

// Kaydedilmiş dil tercihini al
export const getLanguagePreference = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage && supportedLanguages.includes(savedLanguage)
      ? savedLanguage
      : DEFAULT_LANGUAGE;
  } catch (error) {
    console.error("Error getting language preference:", error);
    return DEFAULT_LANGUAGE;
  }
};

// i18n'i başlat
export const initializeI18n = async (): Promise<void> => {
  const savedLanguage = await getLanguagePreference();

  await i18n.use(initReactI18next).init({
    // Dil kaynakları
    resources: {
      tr: {
        common: trCommon,
      },
      en: {
        common: enCommon,
      },
    },

    // Başlangıç dili
    lng: savedLanguage,

    // Fallback dili
    fallbackLng: DEFAULT_LANGUAGE,

    // Namespace
    defaultNS: "common",

    // Debug modu (development için)
    debug: __DEV__,

    // Interpolation ayarları
    interpolation: {
      escapeValue: false, // React zaten escape ediyor
    },

    // React ayarları
    react: {
      useSuspense: false, // React Native için gerekli
    },
  });
};

export default i18n;
