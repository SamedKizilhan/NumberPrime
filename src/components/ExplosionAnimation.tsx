import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

interface ExplosionAnimationProps {
  x: number;
  y: number;
  cellSize: number;
  type: "normal" | "prime" | "prime2" | "combo";
  onComplete: () => void;
}

const ExplosionAnimation: React.FC<ExplosionAnimationProps> = ({
  x,
  y,
  cellSize,
  type,
  onComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rayScaleAnim = useRef(new Animated.Value(0)).current;
  const rayOpacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (type === "prime" || type === "prime2") {
      // Prime explosion için ışın animasyonu
      Animated.parallel([
        Animated.timing(rayScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rayOpacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete();
      });
    } else {
      // Normal animasyon (diğer patlama türleri için)
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete();
      });
    }
  }, []);

  // Explosion tipine göre özellikler
  const getExplosionProps = () => {
    switch (type) {
      case "normal":
        return {
          size: cellSize * 1.2,
          color: "#FFD700",
          borderColor: "#FFA500",
        };
      case "prime":
        return {
          size: cellSize * 1.8, // Normal explosion için size de ekle
          rayLength: cellSize * 3, // Işın uzunluğu
          rayWidth: 6, // Işın kalınlığı
          color: "#00FFFF",
          borderColor: "#00d2d3",
          glowColor: "rgba(0, 255, 255, 0.8)",
        };
      case "prime2":
        return {
          size: cellSize * 2.2, // Normal explosion için size de ekle
          rayLength: cellSize * 4, // Daha uzun ışınlar
          rayWidth: 8, // Daha kalın ışınlar
          color: "#FF00FF",
          borderColor: "#e94560",
          glowColor: "rgba(255, 0, 255, 0.9)",
        };
      case "combo":
        return {
          size: cellSize * 2.8,
          color: "#32CD32",
          borderColor: "#00FF00",
        };
      default:
        return {
          size: cellSize * 1.2,
          color: "#FFD700",
          borderColor: "#FFA500",
        };
    }
  };

  const explosionProps = getExplosionProps();

  // Prime explosions için ışın efekti
  if (type === "prime" || type === "prime2") {
    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Type safety için kontrol
    const rayLength = explosionProps.rayLength || cellSize * 3;
    const rayWidth = explosionProps.rayWidth || 6;
    const glowColor = explosionProps.glowColor || "rgba(0, 255, 255, 0.8)";

    return (
      <View
        style={{
          position: "absolute",
          left: centerX - rayLength,
          top: centerY - rayLength,
          width: rayLength * 2,
          height: rayLength * 2,
        }}
      >
        {/* Merkez parlak nokta */}
        <Animated.View
          style={[
            styles.centerGlow,
            {
              left: rayLength - 8,
              top: rayLength - 8,
              backgroundColor: explosionProps.color,
              shadowColor: glowColor,
              transform: [{ scale: rayScaleAnim }],
              opacity: rayOpacityAnim,
            },
          ]}
        />

        {/* Yatay ışın (soldan sağa) */}
        <Animated.View
          style={[
            styles.ray,
            styles.horizontalRay,
            {
              top: rayLength - rayWidth / 2,
              height: rayWidth,
              width: rayLength * 2,
              backgroundColor: explosionProps.color,
              shadowColor: glowColor,
              transform: [{ scaleX: rayScaleAnim }],
              opacity: rayOpacityAnim,
            },
          ]}
        />

        {/* Dikey ışın (yukarıdan aşağıya) */}
        <Animated.View
          style={[
            styles.ray,
            styles.verticalRay,
            {
              left: rayLength - rayWidth / 2,
              width: rayWidth,
              height: rayLength * 2,
              backgroundColor: explosionProps.color,
              shadowColor: glowColor,
              transform: [{ scaleY: rayScaleAnim }],
              opacity: rayOpacityAnim,
            },
          ]}
        />

        {/* Ekstra parıltı efektleri (sadece prime2 için) */}
        {type === "prime2" && (
          <>
            {/* Küçük parıltı noktaları */}
            <Animated.View
              style={[
                styles.sparkle,
                {
                  left: rayLength + rayLength * 0.7,
                  top: rayLength - 3,
                  backgroundColor: explosionProps.borderColor,
                  transform: [{ scale: rayScaleAnim }],
                  opacity: rayOpacityAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkle,
                {
                  left: rayLength - rayLength * 0.7,
                  top: rayLength - 3,
                  backgroundColor: explosionProps.borderColor,
                  transform: [{ scale: rayScaleAnim }],
                  opacity: rayOpacityAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkle,
                {
                  left: rayLength - 3,
                  top: rayLength + rayLength * 0.7,
                  backgroundColor: explosionProps.borderColor,
                  transform: [{ scale: rayScaleAnim }],
                  opacity: rayOpacityAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkle,
                {
                  left: rayLength - 3,
                  top: rayLength - rayLength * 0.7,
                  backgroundColor: explosionProps.borderColor,
                  transform: [{ scale: rayScaleAnim }],
                  opacity: rayOpacityAnim,
                },
              ]}
            />
          </>
        )}
      </View>
    );
  }

  // Normal explosion efekti (diğer türler için)
  const left = x * cellSize + (cellSize - explosionProps.size) / 2;
  const top = y * cellSize + (cellSize - explosionProps.size) / 2;

  return (
    <Animated.View
      style={[
        styles.explosion,
        {
          left,
          top,
          width: explosionProps.size,
          height: explosionProps.size,
          borderRadius: explosionProps.size / 2,
          backgroundColor: explosionProps.color,
          borderColor: explosionProps.borderColor,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* İç parıltı efekti */}
      <View
        style={[
          styles.innerGlow,
          {
            backgroundColor: explosionProps.borderColor,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Normal explosion stilleri
  explosion: {
    position: "absolute",
    borderWidth: 3,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  innerGlow: {
    position: "absolute",
    top: "25%",
    left: "25%",
    width: "50%",
    height: "50%",
    borderRadius: 1000,
    opacity: 0.6,
  },

  // Prime explosion stilleri (ışın efektleri)
  centerGlow: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 15,
  },
  ray: {
    position: "absolute",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  horizontalRay: {
    borderRadius: 3,
  },
  verticalRay: {
    borderRadius: 3,
  },
  sparkle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});

export default ExplosionAnimation;
