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

  useEffect(() => {
    // Animasyon başlat
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
  }, []);

  // Explosion tipine göre çap ve renk belirleme
  const getExplosionProps = () => {
    switch (type) {
      case "normal":
        return {
          size: cellSize * 1.2, // Normal patlama - biraz büyük
          color: "#FFD700", // Altın sarısı
          borderColor: "#FFA500", // Turuncu border
        };
      case "prime":
        return {
          size: cellSize * 1.8, // Prime patlama - orta boy (normal'den büyük ama prime2'den küçük)
          color: "#00FFFF", // Açık mavi
          borderColor: "#00d2d3", // Turkuaz border
        };
      case "prime2":
        return {
          size: cellSize * 2.2, // Prime2 patlama - büyük (prime'dan biraz büyük)
          color: "#FF00FF", // Magenta
          borderColor: "#e94560", // Kırmızımsı border
        };
      case "combo":
        return {
          size: cellSize * 2.8, // Combo patlama - en büyük
          color: "#32CD32", // Lime yeşili
          borderColor: "#00FF00", // Parlak yeşil border
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
});

export default ExplosionAnimation;
