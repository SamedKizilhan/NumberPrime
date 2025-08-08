import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import {
  GridCell,
  FallingBlock,
  GRID_WIDTH,
  GRID_HEIGHT,
} from "../types/GameTypes";
import { isPrime } from "../utils/GameUtils";
import ExplosionAnimation from "./ExplosionAnimation";

interface GameGridProps {
  grid: GridCell[][];
  fallingBlock: FallingBlock | null;
  explosions?: Array<{
    x: number;
    y: number;
    type: "normal" | "prime" | "prime2" | "combo" | "special";
    id: string;
  }>;
}

const { width, height } = Dimensions.get("window");
// Doğru tablet tespiti
const isTablet = Math.min(width, height) > 700 || width > 1000 || height > 1000;
const isSmallPhone = Math.min(width, height) <= 360;

const AVAILABLE_WIDTH = width - (isTablet ? 60 : 80);

let AVAILABLE_HEIGHT;
if (isTablet) {
  AVAILABLE_HEIGHT = height * 0.68;
} else if (isSmallPhone) {
  AVAILABLE_HEIGHT = height * 0.59;
} else {
  AVAILABLE_HEIGHT = height * 0.6;
}
const CELL_SIZE_BY_WIDTH = AVAILABLE_WIDTH / GRID_WIDTH;
const CELL_SIZE_BY_HEIGHT = AVAILABLE_HEIGHT / GRID_HEIGHT;
export const CELL_SIZE = Math.min(CELL_SIZE_BY_WIDTH, CELL_SIZE_BY_HEIGHT);
console.log("Final CELL_SIZE_BY_WIDTH:", CELL_SIZE_BY_WIDTH);
console.log("Final CELL_SIZE_BY_HEIGHT:", CELL_SIZE_BY_HEIGHT);
console.log("Final CELL_SIZE:", CELL_SIZE);
const GameGrid: React.FC<GameGridProps> = ({
  grid,
  fallingBlock,
  explosions = [],
}) => {
  const [activeExplosions, setActiveExplosions] = useState<
    Array<{
      x: number;
      y: number;
      type: "normal" | "prime" | "prime2" | "combo" | "special";
      id: string;
    }>
  >([]);

  // Yeni patlamalar geldiğinde state'i güncelle
  useEffect(() => {
    if (explosions.length > 0) {
      setActiveExplosions((prev) => [...prev, ...explosions]);
    }
  }, [explosions]);

  const handleExplosionComplete = (explosionId: string) => {
    setActiveExplosions((prev) => prev.filter((exp) => exp.id !== explosionId));
  };

  const renderCell = (cell: GridCell, isFalling: boolean = false) => {
    const isSpecialFalling = isFalling && fallingBlock?.isSpecial;
    const isSpecialStatic = !isFalling && cell.isSpecial; // Grid'deki özel blok

    // Style priority: Special > Prime > Normal > Falling
    const cellStyle = [
      styles.cell,
      // 1. Önce özel blok kontrolü
      isSpecialFalling || isSpecialStatic ? styles.specialCell : null,
      // 2. Özel blok DEĞİLSE ve düşüyorsa falling style
      isFalling && !(isSpecialFalling || isSpecialStatic)
        ? styles.fallingCell
        : null,
      // 3. Özel blok DEĞİLSE ve asal sayıysa prime style
      !isSpecialFalling && !isSpecialStatic && cell.value && isPrime(cell.value)
        ? styles.primeCell
        : null,
      // 4. Özel blok DEĞİLSE ve asal olmayan sayıysa normal style
      !isSpecialFalling &&
      !isSpecialStatic &&
      cell.value &&
      !isPrime(cell.value) &&
      !isFalling
        ? styles.normalCell
        : null,
    ].filter((style) => style !== null);

    // Text color logic
    let textColor = "#fff"; // Default beyaz
    if (isSpecialFalling || isSpecialStatic) {
      textColor = "#000000"; // Special blok için siyah
    }

    return (
      <View key={cell.id} style={cellStyle}>
        {cell.value !== null && (
          <Text
            style={[
              styles.cellText,
              isFalling ? styles.fallingCellText : null,
              { color: textColor }, // Dynamic text color
            ]}
          >
            {cell.value}
          </Text>
        )}
        {(isSpecialFalling || isSpecialStatic) && (
          <View style={styles.shimmerOverlay} />
        )}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {grid.map((row, y) => (
            <View key={y} style={styles.row}>
              {row.map((cell, x) => {
                // Düşen blok bu pozisyonda mı?
                const isFallingHere =
                  fallingBlock &&
                  fallingBlock.x === cell.x &&
                  fallingBlock.y === cell.y;

                if (isFallingHere) {
                  // Düşen blok göster
                  const fallingCell: GridCell = {
                    ...cell,
                    value: fallingBlock.value,
                    id: fallingBlock.id,
                  };
                  return renderCell(fallingCell, true);
                }

                return renderCell(cell);
              })}
            </View>
          ))}
        </View>

        {/* Patlama animasyonları */}
        {activeExplosions.map((explosion) => (
          <ExplosionAnimation
            key={explosion.id}
            x={explosion.x}
            y={explosion.y}
            cellSize={CELL_SIZE}
            type={explosion.type}
            onComplete={() => handleExplosionComplete(explosion.id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    maxHeight: "100%",
  },
  gridContainer: {
    borderWidth: 4,
    borderColor: "#e94560",
    backgroundColor: "#0f3460",
  },
  grid: {
    flexDirection: "column",
    width: GRID_WIDTH * CELL_SIZE,
    height: GRID_HEIGHT * CELL_SIZE,
    backgroundColor: "#0f3460",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: "#2a2a3e",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  fallingCell: {
    backgroundColor: "#e94560",
    shadowColor: "#e94560",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  primeCell: {
    backgroundColor: "#00d2d3",
    shadowColor: "#00d2d3",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  cellText: {
    color: "#fff",
    fontSize: CELL_SIZE * 0.35,
    fontWeight: "bold",
    textAlign: "center",
  },
  fallingCellText: {
    color: "#fff",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  normalCell: {
    backgroundColor: "#e94560", // Düşen blok ile aynı renk
    shadowColor: "#e94560",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4, // Daha hafif gölge
    shadowRadius: 5,
    elevation: 5,
  },
  specialCell: {
    backgroundColor: "#FFD700", // Altın rengi
    shadowColor: "#FFD700",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
  },
});

export default GameGrid;
