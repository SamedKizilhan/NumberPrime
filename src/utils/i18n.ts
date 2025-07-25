import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";

// Dil dosyalarını import et
import trCommon from "../locales/tr/common.json";
import enCommon from "../locales/en/common.json";

// Mevcut dillerin listesi
const supportedLanguages = ["tr", "en"];

// Cihazın dilini al
const deviceLanguage = RNLocalize.getLocales()[0]?.languageCode || "tr";

// Desteklenen dil mi kontrol et
const fallbackLanguage = supportedLanguages.includes(deviceLanguage)
  ? deviceLanguage
  : "tr";

// i18n konfigürasyonu
i18n.use(initReactI18next).init({
  // Dil kaynakları
  resources: {
    tr: {
      common: trCommon,
    },
    en: {
      common: enCommon,
    },
  },

  // Varsayılan dil
  lng: fallbackLanguage,

  // Fallback dili
  fallbackLng: "tr",

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

export default i18n;
