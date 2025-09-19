import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import IAPManager, { SupportProduct } from "../utils/IAPManager";

interface SupportScreenProps {
  onBack: () => void;
}

const SupportScreen: React.FC<SupportScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<SupportProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    initializeIAP();
  }, []);

  const initializeIAP = async () => {
    try {
      const iapManager = IAPManager.getInstance();
      const initialized = await iapManager.initialize();

      if (initialized) {
        const productsWithPrices = iapManager.getProductsWithPrices();
        setProducts(productsWithPrices);
      } else {
        // Fallback to mock data for development
        console.log("IAP: Using mock products for development");
        const mockProducts = iapManager.getMockProducts();
        setProducts(mockProducts);
      }
    } catch (error) {
      console.log("Support Screen: IAP initialization error:", error);
      // Show mock products as fallback
      const iapManager = IAPManager.getInstance();
      const mockProducts = iapManager.getMockProducts();
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      setPurchasing(productId);
      const iapManager = IAPManager.getInstance();
      await iapManager.purchaseProduct(productId);
    } catch (error) {
      console.log("Support Screen: Purchase error:", error);
      Alert.alert(t("support.error"), t("support.purchaseError"));
    } finally {
      setPurchasing(null);
    }
  };

  const renderProductButton = (product: SupportProduct) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productButton}
      onPress={() => handlePurchase(product.id)}
      activeOpacity={0.7}
      disabled={purchasing !== null}
    >
      <View style={styles.productIcon}>
        <Text style={styles.iconText}>{product.icon}</Text>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{product.title}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>
      </View>

      <View style={styles.productPrice}>
        {purchasing === product.id ? (
          <ActivityIndicator size="small" color="#e94560" />
        ) : (
          <Text style={styles.priceText}>
            {product.localizedPrice || "N/A"}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>{t("support.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{t("support.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("support.title")}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t("support.subtitle")}</Text>

        {/* Welcome Message */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>{t("support.welcomeTitle")}</Text>
          <Text style={styles.welcomeText}>{t("support.welcomeText")}</Text>
        </View>

        {/* Support Products */}
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>{t("support.chooseSupport")}</Text>
          {products.map(renderProductButton)}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>{t("support.benefitsTitle")}</Text>
          <Text style={styles.benefitItem}>• {t("support.benefit1")}</Text>
          <Text style={styles.benefitItem}>• {t("support.benefit2")}</Text>
          <Text style={styles.benefitItem}>• {t("support.benefit3")}</Text>
          <Text style={styles.benefitItem}>• {t("support.benefit4")}</Text>
        </View>

        {/* Thank You Note */}
        <View style={styles.thankYouCard}>
          <Text style={styles.thankYouTitle}>❤️ {t("support.thankYou")}</Text>
          <Text style={styles.thankYouText}>{t("support.thankYouText")}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 15,
  },

  // Header
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
    marginRight: 80,
  },
  subtitle: {
    fontSize: 16,
    color: "#a0a0a0",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: "#16213e",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e94560",
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e94560",
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 20,
    textAlign: "center",
  },

  // Products
  productsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00d2d3",
    marginBottom: 15,
    textAlign: "center",
  },
  productButton: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#0f3460",
    flexDirection: "row",
    alignItems: "center",
  },
  productIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0f3460",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: "#a0a0a0",
  },
  productPrice: {
    minWidth: 60,
    alignItems: "center",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e94560",
  },

  // Benefits Card
  benefitsCard: {
    backgroundColor: "#1a2332",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#00d2d3",
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00d2d3",
    marginBottom: 12,
    textAlign: "center",
  },
  benefitItem: {
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 6,
    lineHeight: 18,
  },

  // Thank You Card
  thankYouCard: {
    backgroundColor: "#2d1b3d",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#8e44ad",
  },
  thankYouTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8e44ad",
    marginBottom: 12,
    textAlign: "center",
  },
  thankYouText: {
    fontSize: 14,
    color: "#ffffff",
    lineHeight: 20,
    textAlign: "center",
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
  },
});

export default SupportScreen;
