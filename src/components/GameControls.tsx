import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Operation } from "../types/GameTypes";

interface GameControlsProps {
  selectedOperation: Operation;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDropBlock: () => void;
  onSelectOperation: (operation: Operation) => void;
}

const { width } = Dimensions.get("window");

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
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: "#1a1a2e",
    minHeight: 120,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#16213e",
    borderWidth: 2,
    borderColor: "#0f3460",
    justifyContent: "center",
    alignItems: "center",
  },
  operationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: 24,
    fontWeight: "bold",
  },
  selectedOperationButtonText: {
    color: "#fff",
  },
  movementButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  dropButton: {
    width: 120, // + ve - tuşlarının toplamından biraz büyük
    height: 50,
    borderRadius: 25,
    backgroundColor: "#00d2d3",
    borderWidth: 2,
    borderColor: "#00d2d3",
    justifyContent: "center",
    alignItems: "center",
  },
  dropButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default GameControls;
