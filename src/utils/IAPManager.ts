import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  Product,
  Purchase,
  PurchaseError,
} from "react-native-iap";
import { Alert, Platform } from "react-native";

export interface SupportProduct {
  id: string;
  title: string;
  description: string;
  icon: string;
  localizedPrice?: string;
  price?: string;
}

class IAPManager {
  private static instance: IAPManager;
  private products: Product[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  // Güncellenmiş tip ürünleri tanımları
  public readonly supportProducts: SupportProduct[] = [
    {
      id: "small_tip",
      title: "Small Tip",
      description: "Small support 🙏",
      icon: "🙏",
    },
    {
      id: "coffee_tip",
      title: "Coffee",
      description: "Buy me a coffee ☕",
      icon: "☕",
    },
    {
      id: "pizza_tip",
      title: "Pizza",
      description: "Buy me a pizza 🍕",
      icon: "🍕",
    },
    {
      id: "premium_support",
      title: "Premium",
      description: "Premium support 💎",
      icon: "💎",
    },
    {
      id: "mega_support",
      title: "Mega Support",
      description: "Mega support & development 🚀",
      icon: "🚀",
    },
  ];

  private constructor() {}

  public static getInstance(): IAPManager {
    if (!IAPManager.instance) {
      IAPManager.instance = new IAPManager();
    }
    return IAPManager.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
      console.log("IAP: Initializing connection...");
      const result = await initConnection();
      console.log("IAP: Connection result:", result);

      // Purchase listeners
      this.purchaseUpdateSubscription = purchaseUpdatedListener(
        (purchase: Purchase) => {
          console.log("IAP: Purchase successful:", purchase);
          this.handlePurchaseSuccess(purchase);
        }
      );

      this.purchaseErrorSubscription = purchaseErrorListener(
        (error: PurchaseError) => {
          console.log("IAP: Purchase error:", error);
          this.handlePurchaseError(error);
        }
      );

      // Load products
      await this.loadProducts();

      return true;
    } catch (error) {
      console.log("IAP: Initialize error:", error);
      return false;
    }
  }

  private async loadProducts(): Promise<void> {
    const productIds = this.supportProducts.map((p) => p.id);
    console.log("IAP: Loading products:", productIds);

    try {
      // Yeni API formatı - her iki platform için uyumlu
      const products = await getProducts({
        skus: productIds,
      });

      this.products = products;
      console.log("IAP: Products loaded:", products);
    } catch (error) {
      console.log("IAP: Load products error:", error);
      // Fallback - eski API formatını dene
      try {
        console.log("IAP: Trying legacy API format...");
        const legacyProducts = await getProducts(productIds as any);
        this.products = legacyProducts;
        console.log("IAP: Legacy products loaded:", legacyProducts);
      } catch (legacyError) {
        console.log("IAP: Legacy API also failed:", legacyError);
      }
    }
  }

  public getProductsWithPrices(): SupportProduct[] {
    return this.supportProducts.map((supportProduct) => {
      const product = this.products.find(
        (p) => p.productId === supportProduct.id
      );
      return {
        ...supportProduct,
        localizedPrice: product?.localizedPrice || "N/A",
        price: product?.price || "0",
      };
    });
  }

  // Bölge bazlı fiyat gösterimi için
  public getLocalizedPricing(productId: string): string {
    const product = this.products.find((p) => p.productId === productId);
    if (product?.localizedPrice) {
      return product.localizedPrice;
    }

    // Fallback fiyatlar (geliştirme ortamı için)
    const fallbackPrices: { [key: string]: string } = {
      small_tip: "₺39,90",
      coffee_tip: "₺79,90",
      pizza_tip: "₺149,90",
      premium_support: "₺295,00",
      mega_support: "₺495,00",
    };

    return fallbackPrices[productId] || "N/A";
  }

  public async purchaseProduct(productId: string): Promise<void> {
    try {
      console.log("IAP: Requesting purchase for:", productId);

      // Yeni API formatı
      await requestPurchase({
        sku: productId,
      });
    } catch (error) {
      console.log("IAP: Purchase request error:", error);

      // Fallback - eski API formatını dene
      try {
        console.log("IAP: Trying legacy purchase API...");
        await requestPurchase(productId as any);
      } catch (legacyError) {
        console.log("IAP: Legacy purchase API also failed:", legacyError);
        Alert.alert(
          "Purchase Error",
          "Unable to process purchase. Please try again."
        );
      }
    }
  }

  private handlePurchaseSuccess(purchase: Purchase): void {
    console.log("IAP: Handling successful purchase:", purchase.productId);

    // Başarılı satın alma sonrası teşekkür mesajı
    const product = this.supportProducts.find(
      (p) => p.id === purchase.productId
    );
    const productName = product?.title || "Unknown";

    Alert.alert(
      "Thank You! ❤️",
      `Your ${productName} support means a lot to us!\n\nYour contribution helps us keep NumPrime ad-free and add new features.`,
      [{ text: "You're Welcome!", style: "default" }]
    );
  }

  private handlePurchaseError(error: PurchaseError): void {
    console.log("IAP: Handling purchase error:", error);

    // User cancelled gibi normal durumlar için alert gösterme
    if (error.code === "E_USER_CANCELLED") {
      return;
    }

    Alert.alert(
      "Purchase Failed",
      "Something went wrong with your purchase. Please try again.",
      [{ text: "OK", style: "default" }]
    );
  }

  public async cleanup(): Promise<void> {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }

      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      await endConnection();
      console.log("IAP: Cleanup completed");
    } catch (error) {
      console.log("IAP: Cleanup error:", error);
    }
  }

  // Test için - development ortamında ürünleri simüle et
  public getMockProducts(): SupportProduct[] {
    return this.supportProducts.map((product) => ({
      ...product,
      localizedPrice:
        product.id === "small_tip"
          ? "₺39,90"
          : product.id === "coffee_tip"
          ? "₺79,90"
          : product.id === "pizza_tip"
          ? "₺149,90"
          : product.id === "premium_support"
          ? "₺295,00"
          : "₺495,00",
      price:
        product.id === "small_tip"
          ? "39.90"
          : product.id === "coffee_tip"
          ? "79.90"
          : product.id === "pizza_tip"
          ? "149.90"
          : product.id === "premium_support"
          ? "295.00"
          : "495.00",
    }));
  }
}

export default IAPManager;
