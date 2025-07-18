import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  BackHandler,
} from "react-native";
import GameGrid from "../components/GameGrid";
import GameControls from "../components/GameControls";
import GameHeader from "../components/GameHeader";
import {
  GameState,
  Operation,
  GRID_WIDTH,
  GRID_HEIGHT,
} from "../types/GameTypes";
import {
  createEmptyGrid,
  createNewFallingBlock,
  performOperation,
  findMatchingNeighbors,
  findPrimeCrossExplosion,
  applyGravity,
  isPrime,
  calculateGameSpeed,
  getPlayerTitle,
} from "../utils/GameUtils";

interface GameScreenProps {
  onGameEnd: () => void;
  playerNickname: string;
}

const { width, height } = Dimensions.get("window");

const GameScreen: React.FC<GameScreenProps> = ({
  onGameEnd,
  playerNickname,
}) => {
  const [gameState, setGameState] = useState<GameState>({
    grid: createEmptyGrid(),
    fallingBlock: createNewFallingBlock(),
    score: 0,
    isGameOver: false,
    selectedOperation: "none",
    level: 1,
    gameSpeed: calculateGameSpeed(1),
  });

  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Oyun döngüsü
  useEffect(() => {
    if (gameState.isGameOver) {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
        gameIntervalRef.current = null;
      }
      return;
    }

    // Timer başlat
    gameIntervalRef.current = setInterval(() => {
      moveBlockDownRef.current();
    }, gameState.gameSpeed);

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, [gameState.gameSpeed, gameState.isGameOver]);

  // Geri tuşu kontrolü
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        Alert.alert(
          "Oyundan Çık",
          "Oyunu sonlandırmak istediğinize emin misiniz?",
          [
            { text: "Hayır", style: "cancel" },
            { text: "Evet", onPress: onGameEnd },
          ]
        );
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  // moveBlockDown fonksiyonunu ref olarak sakla
  const moveBlockDownRef = useRef(() => {});

  moveBlockDownRef.current = () => {
    setGameState((prevState) => {
      if (!prevState.fallingBlock || prevState.isGameOver) return prevState;

      const currentBlock = prevState.fallingBlock;
      const newY = currentBlock.y + 1;

      // Alt sınıra veya dolu hücreye çarptı mı?
      if (
        newY >= GRID_HEIGHT ||
        prevState.grid[newY][currentBlock.x].value !== null
      ) {
        return landBlock(prevState);
      }

      // Bloğu sadece Y ekseninde aşağı taşı - X koordinatı değişmemeli!
      return {
        ...prevState,
        fallingBlock: {
          ...prevState.fallingBlock,
          y: newY,
          // x koordinatı açıkça belirtiyoruz - değişmemeli
          x: currentBlock.x,
        },
      };
    });
  };

  const landBlock = (state: GameState): GameState => {
    if (!state.fallingBlock) return state;

    const { fallingBlock, grid, selectedOperation } = state;

    // Blok şu anda bulunduğu pozisyonda kalmalı - koordinatları sabit
    const landingY = fallingBlock.y;
    const landingX = fallingBlock.x;

    // Eğer blok grid sınırları dışındaysa oyun bitti
    if (
      landingY < 0 ||
      landingY >= GRID_HEIGHT ||
      landingX < 0 ||
      landingX >= GRID_WIDTH
    ) {
      return {
        ...state,
        isGameOver: true,
        fallingBlock: null,
      };
    }

    // Eğer en üstteyse ve hücre doluysa oyun bitti
    // grid[y][x] formatında kontrol et
    if (landingY === 0 && grid[landingY][landingX].value !== null) {
      return {
        ...state,
        isGameOver: true,
        fallingBlock: null,
      };
    }

    const newGrid = grid.map((row) => [...row]);
    // grid[y][x] formatında erişim
    const existingValue = newGrid[landingY][landingX].value;

    // İşlem yap
    if (existingValue !== null && selectedOperation !== "none") {
      // Mevcut bloktaki değeri güncelle (işlem sonucu)
      const resultValue = performOperation(
        fallingBlock.value,
        existingValue,
        selectedOperation
      );
      newGrid[landingY][landingX].value = resultValue;

      // Patlamaları kontrol et
      let { scoreGained } = checkExplosions(
        newGrid,
        landingX,
        landingY,
        resultValue
      );

      // Gravity uygula
      let finalGrid = applyGravity(newGrid);

      return {
        ...state,
        grid: finalGrid,
        fallingBlock: createNewFallingBlock(),
        score: state.score + scoreGained,
        selectedOperation: "none",
        level: Math.floor((state.score + scoreGained) / 1000) + 1,
        gameSpeed: calculateGameSpeed(
          Math.floor((state.score + scoreGained) / 1000) + 1
        ),
      };
    } else {
      // İşlem yok, sadece düşen bloğu yerleştir
      newGrid[landingY][landingX].value = fallingBlock.value;

      // Patlamaları kontrol et
      let { scoreGained } = checkExplosions(
        newGrid,
        landingX,
        landingY,
        fallingBlock.value
      );

      // Gravity uygula
      let finalGrid = applyGravity(newGrid);

      return {
        ...state,
        grid: finalGrid,
        fallingBlock: createNewFallingBlock(),
        score: state.score + scoreGained,
        selectedOperation: "none",
        level: Math.floor((state.score + scoreGained) / 1000) + 1,
        gameSpeed: calculateGameSpeed(
          Math.floor((state.score + scoreGained) / 1000) + 1
        ),
      };
    }
  };

  const checkExplosions = (
    grid: any[][],
    x: number,
    y: number,
    value: number
  ) => {
    let totalScore = 0;
    let cellsToExplode: Set<string> = new Set();

    // Asal sayı kontrolü - çapraz patlama
    if (isPrime(value)) {
      const primeCells = findPrimeCrossExplosion(grid, x, y);
      primeCells.forEach((cell) => {
        if (cell.value !== null) {
          cellsToExplode.add(`${cell.x}-${cell.y}`);
          totalScore += cell.value * 10; // Asal patlama bonusu
        }
      });
    }

    // Eşit sayı kontrolü - 4 yöndeki komşular
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]; // aşağı, yukarı, sağ, sol

    for (const [dx, dy] of directions) {
      const neighborX = x + dx;
      const neighborY = y + dy;

      // Sınır kontrolü
      if (
        neighborX >= 0 &&
        neighborX < GRID_WIDTH &&
        neighborY >= 0 &&
        neighborY < GRID_HEIGHT
      ) {
        const neighborValue = grid[neighborY][neighborX].value;

        // Eğer komşu değer aynıysa
        if (neighborValue === value) {
          // Her iki hücreyi de patlatma listesine ekle
          cellsToExplode.add(`${x}-${y}`);
          cellsToExplode.add(`${neighborX}-${neighborY}`);

          // Bu eşleşen komşuların da komşularını kontrol et
          const matchingCells = findMatchingNeighbors(grid, x, y, value);
          matchingCells.forEach((cell) => {
            if (cell.value !== null) {
              cellsToExplode.add(`${cell.x}-${cell.y}`);
              totalScore += cell.value;
            }
          });
          break; // Bir eşleşme bulduğumuzda yeter
        }
      }
    }

    // Patlamaları uygula
    cellsToExplode.forEach((key) => {
      const [cellX, cellY] = key.split("-").map(Number);
      grid[cellY][cellX].value = null;
    });

    return {
      explosions: cellsToExplode.size,
      scoreGained: totalScore,
    };
  };

  const moveBlockLeft = () => {
    setGameState((prevState) => {
      if (!prevState.fallingBlock || prevState.isGameOver) return prevState;

      const currentBlock = prevState.fallingBlock;
      const newX = currentBlock.x - 1;
      const currentY = currentBlock.y;

      // Sol sınır kontrolü
      if (newX < 0) return prevState;

      // Hedef pozisyon boş mu kontrolü - grid[y][x] formatında
      if (
        currentY < GRID_HEIGHT &&
        prevState.grid[currentY][newX].value !== null
      ) {
        return prevState;
      }

      return {
        ...prevState,
        fallingBlock: {
          ...prevState.fallingBlock,
          x: newX,
          // y koordinatı açıkça belirtiyoruz - değişmemeli
          y: currentY,
        },
      };
    });
  };

  const moveBlockRight = () => {
    setGameState((prevState) => {
      if (!prevState.fallingBlock || prevState.isGameOver) return prevState;

      const currentBlock = prevState.fallingBlock;
      const newX = currentBlock.x + 1;
      const currentY = currentBlock.y;

      // Sağ sınır kontrolü
      if (newX >= GRID_WIDTH) return prevState;

      // Hedef pozisyon boş mu kontrolü - grid[y][x] formatında
      if (
        currentY < GRID_HEIGHT &&
        prevState.grid[currentY][newX].value !== null
      ) {
        return prevState;
      }

      return {
        ...prevState,
        fallingBlock: {
          ...prevState.fallingBlock,
          x: newX,
          // y koordinatı açıkça belirtiyoruz - değişmemeli
          y: currentY,
        },
      };
    });
  };

  const dropBlock = () => {
    setGameState((prevState) => {
      if (!prevState.fallingBlock || prevState.isGameOver) return prevState;

      const currentBlock = prevState.fallingBlock;
      let newY = currentBlock.y;
      const blockX = currentBlock.x;

      // Aşağıda boş yer var mı, varsa en alt noktayı bul
      // grid[y][x] formatında kontrol et
      while (
        newY + 1 < GRID_HEIGHT &&
        prevState.grid[newY + 1][blockX].value === null
      ) {
        newY++;
      }

      // Eğer hareket ettiyse bloğu oraya taşı, yoksa direk yerleştir
      if (newY > currentBlock.y) {
        return {
          ...prevState,
          fallingBlock: {
            ...prevState.fallingBlock,
            y: newY,
            // x koordinatı değişmemeli
            x: blockX,
          },
        };
      } else {
        // Zaten en alttaysa, bloğu yerleştir
        return landBlock(prevState);
      }
    });
  };

  const selectOperation = (operation: Operation) => {
    setGameState((prevState) => ({
      ...prevState,
      selectedOperation:
        prevState.selectedOperation === operation ? "none" : operation,
    }));
  };

  if (gameState.isGameOver) {
    return (
      <View style={styles.gameOverContainer}>
        <Text style={styles.gameOverTitle}>Oyun Bitti!</Text>
        <Text style={styles.gameOverScore}>Skorunuz: {gameState.score}</Text>
        <Text style={styles.gameOverTitle}>
          Unvanınız: {getPlayerTitle(gameState.score)}
        </Text>
        {/* Burada leaderboard kaydetme ve menüye dönme butonları olacak */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameHeader
        score={gameState.score}
        level={gameState.level}
        playerNickname={playerNickname}
        playerTitle={getPlayerTitle(gameState.score)}
      />

      <View style={styles.gameArea}>
        <GameGrid grid={gameState.grid} fallingBlock={gameState.fallingBlock} />
      </View>

      <GameControls
        selectedOperation={gameState.selectedOperation}
        onMoveLeft={moveBlockLeft}
        onMoveRight={moveBlockRight}
        onDropBlock={dropBlock}
        onSelectOperation={selectOperation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  gameArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  gameOverContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#e94560",
    textAlign: "center",
    marginBottom: 20,
  },
  gameOverScore: {
    fontSize: 24,
    color: "#00d2d3",
    textAlign: "center",
    marginBottom: 30,
  },
});

export default GameScreen;
