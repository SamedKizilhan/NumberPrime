import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

interface ScorePopupProps {
  score: number;
  x: number;
  y: number;
  cellSize: number;
  isCombo?: boolean; // Yeni prop ekle
  onComplete: () => void;
}

const ScorePopup: React.FC<ScorePopupProps> = ({
  score,
  x,
  y,
  cellSize,
  isCombo = false, // Default false
  onComplete,
}) => {
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animasyon: yukarı çık, büyü ve fade out
    Animated.parallel([
      Animated.timing(translateYAnim, {
        toValue: -cellSize * 2, // 2 hücre yukarı çık
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        // İlk büyüme
        Animated.timing(scaleAnim, {
          toValue: isCombo ? 1.4 : 1.2, // Combo ise daha büyük
          duration: 200,
          useNativeDriver: true,
        }),
        // Sonra normal boyuta geri dön
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Son olarak küçül ve kaybol
        Animated.timing(scaleAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        // İlk 500ms görünür kal
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Sonra yavaşça kaybol
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });
  }, []);

  // Popup'ın konumunu hesapla - hücrenin ortasında görünecek
  const left = x * cellSize + cellSize / 2 - (isCombo ? 40 : 30); // Combo için daha geniş
  const top = y * cellSize + cellSize / 2 - (isCombo ? 25 : 15); // Combo için daha yüksek

  return (
    <Animated.View
      style={[
        styles.popup,
        {
          left,
          top,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {isCombo && <Text style={styles.comboText}>COMBO!</Text>}
      <Text style={[styles.scoreText, isCombo && styles.comboScoreText]}>
        +{score}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  popup: {
    position: "absolute",
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: "center",
    minWidth: 60,
  },
  comboText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF4500", // Turuncu renk
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: "center",
    marginBottom: 2,
  },
  comboScoreText: {
    fontSize: 24, // Combo skoru daha büyük
    color: "#FF4500", // Combo skoru da turuncu
  },
});

export default ScorePopup;
