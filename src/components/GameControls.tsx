import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Operation } from "../types/GameTypes";
import { SafeAreaView } from "react-native-safe-area-context";

interface GameControlsProps {
  selectedOperation: Operation;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDropBlock: () => void;
  onSelectOperation: (operation: Operation) => void;
}

const { width, height } = Dimensions.get("window");
const isTablet = Math.min(width, height) > 700 || width > 1000 || height > 1000;
const isSmallPhone = Math.min(width, height) <= 360;

const GameControls: React.FC<GameControlsProps> = ({
  selectedOperation,
  onMoveLeft,
  onMoveRight,
  onDropBlock,
  onSelectOperation,
}) => {
  const renderOperationButton = (operation: Operation, symbol: string) => {
    const isSelected = selectedOperation === operation;

    return (
      <TouchableOpacity
        key={operation}
        style={[
          styles.operationButton,
          isSelected && styles.selectedOperationButton,
        ]}
        onPress={() => onSelectOperation(operation)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.operationButtonText,
            isSelected && styles.selectedOperationButtonText,
          ]}
        >
          {symbol}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#1a1a2e" }}>
      <View style={styles.container}>
        {/* Üst sıra - 4 tuş eşit aralıklarla */}
        <View style={styles.topRow}>
          {/* Sol yön tuşu - en solda */}
          <TouchableOpacity
            style={styles.movementButton}
            onPress={onMoveLeft}
            activeOpacity={0.7}
          >
            <Text style={styles.movementButtonText}>◀</Text>
          </TouchableOpacity>

          {/* Eksi tuşu */}
          {renderOperationButton("subtract", "-")}

          {/* Artı tuşu */}
          {renderOperationButton("add", "+")}

          {/* Sağ yön tuşu - en sağda */}
          <TouchableOpacity
            style={styles.movementButton}
            onPress={onMoveRight}
            activeOpacity={0.7}
          >
            <Text style={styles.movementButtonText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Alt sıra - Aşağı tuşu (çubuk şeklinde) */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={[styles.dropButton]}
            onPress={onDropBlock}
            activeOpacity={0.7}
          >
            <Text style={styles.dropButtonText}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 5,
    backgroundColor: "#1a1a2e",
    minHeight: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  bottomRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  movementButton: {
    width: isSmallPhone ? 60 : isTablet ? 120 : 80,
    height: isSmallPhone ? 60 : isTablet ? 120 : 80,
    borderRadius: isSmallPhone ? 30 : isTablet ? 60 : 40,
    backgroundColor: "#16213e",
    borderWidth: 2,
    borderColor: "#0f3460",
    justifyContent: "center",
    alignItems: "center",
  },
  operationButton: {
    width: isSmallPhone ? 50 : isTablet ? 110 : 70,
    height: isSmallPhone ? 50 : isTablet ? 110 : 70,
    borderRadius: isSmallPhone ? 25 : isTablet ? 55 : 35,
    backgroundColor: "#16213e",
    borderWidth: 2,
    borderColor: "#0f3460",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedOperationButton: {
    backgroundColor: "#e94560",
    borderColor: "#e94560",
    shadowColor: "#e94560",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  operationButtonText: {
    color: "#666",
    fontSize: isSmallPhone ? 20 : isTablet ? 36 : 28,
    fontWeight: "bold",
  },
  selectedOperationButtonText: {
    color: "#fff",
  },
  movementButtonText: {
    color: "#fff",
    fontSize: isSmallPhone ? 18 : isTablet ? 32 : 24,
    fontWeight: "bold",
  },
  dropButton: {
    width: isSmallPhone ? 80 : isTablet ? 180 : 120,
    height: isSmallPhone ? 40 : isTablet ? 70 : 50,
    borderRadius: isSmallPhone ? 20 : isTablet ? 35 : 25,
    backgroundColor: "#00d2d3",
    borderWidth: 2,
    borderColor: "#00d2d3",
    justifyContent: "center",
    alignItems: "center",
  },
  dropButtonText: {
    color: "#fff",
    fontSize: isSmallPhone ? 16 : isTablet ? 28 : 20,
    fontWeight: "bold",
  },
});

export default GameControls;
