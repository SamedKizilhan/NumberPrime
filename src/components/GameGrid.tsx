import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
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
    type: "normal" | "prime" | "prime2";
    id: string;
  }>;
}

const { width, height } = Dimensions.get("window");
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

const GameGrid: React.FC<GameGridProps> = ({
  grid,
  fallingBlock,
  explosions = [],
}) => {
  const [activeExplosions, setActiveExplosions] = useState<
    Array<{
      x: number;
      y: number;
      type: "normal" | "prime" | "prime2";
      id: string;
    }>
  >([]);

  useEffect(() => {
    if (explosions.length > 0) {
      setActiveExplosions((prev) => [...prev, ...explosions]);
    }
  }, [explosions]);

  const handleExplosionComplete = (explosionId: string) => {
    setActiveExplosions((prev) => prev.filter((exp) => exp.id !== explosionId));
  };

  const renderCell = (cell: GridCell) => {
    const cellStyle = [
      styles.cell,
      // Değer varsa ve prime ise prime style ekle
      cell.value !== null && isPrime(cell.value) ? styles.primeCell : null,
      // Değer varsa ve prime değilse normal style ekle
      cell.value !== null && !isPrime(cell.value) ? styles.normalCell : null,
    ].filter((style) => style !== null);

    return (
      <View key={cell.id} style={cellStyle}>
        {cell.value !== null && (
          <Text style={styles.cellText}>{cell.value}</Text>
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
                  return renderCell(fallingCell);
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
  normalCell: {
    backgroundColor: "#e94560",
    shadowColor: "#e94560",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  cellText: {
    color: "#fff",
    fontSize: CELL_SIZE * 0.35,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default GameGrid;
