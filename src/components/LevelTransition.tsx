import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { useTranslation } from "react-i18next";

interface LevelTransitionProps {
  level: number;
  isVisible: boolean;
  onComplete: () => void;
}

const { width, height } = Dimensions.get("window");
const LevelTransition: React.FC<LevelTransitionProps> = ({
  level,
  isVisible,
  onComplete,
}) => {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Animasyon başlat
      Animated.sequence([
        // Görünür ol ve büyü
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // 1.5 saniye bekle
        Animated.delay(1500),
        // Kaybol
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onComplete();
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.levelText}>SEVİYE</Text>
          <Text style={styles.levelNumber}>{level}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    backgroundColor: "#16213e",
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 30,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0f3460",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  levelText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e94560",
    marginBottom: 10,
    letterSpacing: 2,
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    textShadowColor: "#0f3460",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});

export default LevelTransition;
