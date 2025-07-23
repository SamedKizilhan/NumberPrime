import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

interface ScorePopupProps {
  score: number;
  x: number;
  y: number;
  cellSize: number;
  onComplete: () => void;
}

const ScorePopup: React.FC<ScorePopupProps> = ({
  score,
  x,
  y,
  cellSize,
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
          toValue: 1.2,
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
  const left = x * cellSize + cellSize / 2 - 30; // 30 = tahmini text width/2
  const top = y * cellSize + cellSize / 2 - 15; // 15 = tahmini text height/2

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
      <Text style={styles.scoreText}>+{score}</Text>
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
});

export default ScorePopup;
