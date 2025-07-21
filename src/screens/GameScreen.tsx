import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  BackHandler,
  TouchableOpacity,
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
import SoundManager from "../utils/SoundManager";

interface GameScreenProps {
  onGameEnd: () => void;
  playerNickname: string;
}

// Explosion interface tanımı
interface Explosion {
  x: number;
  y: number;
  type: "normal" | "prime" | "prime2" | "combo";
  id: string;
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

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const soundManager = SoundManager.getInstance();

  // Ses sistemini başlat
  useEffect(() => {
    const initializeSound = async () => {
      await soundManager.initialize();
      await soundManager.playBackgroundMusic();
    };

    initializeSound();

    // Cleanup
    return () => {
      soundManager.cleanup();
    };
  }, []);

  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Oyun döngüsü
  useEffect(() => {
    if (gameState.isGameOver || isPaused) {
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
  }, [gameState.gameSpeed, gameState.isGameOver, isPaused]);

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

      // Alt sınıra ulaştı mı?
      if (newY >= GRID_HEIGHT) {
        return landBlock(prevState);
      }

      // Hedef hücre dolu mu?
      if (prevState.grid[newY][currentBlock.x].value !== null) {
        // Dolu hücreye iniyor - işlem kontrolü yap
        const { selectedOperation } = prevState;

        if (selectedOperation === "add" || selectedOperation === "subtract") {
          // İşlem yap ve her iki bloğu da yerleştir
          const newGrid = prevState.grid.map((row) => [...row]);
          const existingValue = newGrid[newY][currentBlock.x].value;

          const resultValue = performOperation(
            currentBlock.value,
            existingValue!,
            selectedOperation
          );

          // Alt hücreye işlem sonucunu yaz
          newGrid[newY][currentBlock.x].value = resultValue;
          // Üst hücreye düşen bloğun değerini yaz
          newGrid[currentBlock.y][currentBlock.x].value = currentBlock.value;

          // İşlem sonucunu kontrol et
          let { scoreGained: scoreFromResult } = checkExplosions(
            newGrid,
            currentBlock.x,
            newY,
            resultValue
          );
          let totalScore = scoreFromResult;

          // Gravity uygula
          let finalGrid = applyGravity(newGrid);

          // Gravity sonrası tüm grid'i kontrol et - yeni eşitlikler oluşmuş olabilir
          let hasMoreExplosions = true;
          while (hasMoreExplosions) {
            hasMoreExplosions = false;
            let explosionScore = 0;

            for (let y = 0; y < GRID_HEIGHT; y++) {
              for (let x = 0; x < GRID_WIDTH; x++) {
                if (finalGrid[y][x].value !== null) {
                  const beforeExplosionGrid = finalGrid.map((row) => [...row]);
                  let { scoreGained } = checkExplosions(
                    finalGrid,
                    x,
                    y,
                    finalGrid[y][x].value!
                  );

                  if (scoreGained > 0) {
                    explosionScore += scoreGained;
                    hasMoreExplosions = true;
                    // Gravity tekrar uygula
                    finalGrid = applyGravity(finalGrid);
                    break; // Bir patlama oldu, döngüyü yeniden başlat
                  }
                }
              }
              if (hasMoreExplosions) break; // Dış döngüden de çık
            }
            totalScore += explosionScore;
          }

          return {
            ...prevState,
            grid: finalGrid,
            fallingBlock: createNewFallingBlock(),
            score: prevState.score + totalScore,
            selectedOperation: "none",
            level: Math.floor((prevState.score + totalScore) / 1000) + 1,
            gameSpeed: calculateGameSpeed(
              Math.floor((prevState.score + totalScore) / 1000) + 1
            ),
          };
        } else {
          // İşlem yok - blok mevcut pozisyonda dur
          return landBlock(prevState);
        }
      }

      // Hedef hücre boş - bloğu aşağı taşı
      return {
        ...prevState,
        fallingBlock: {
          ...prevState.fallingBlock,
          y: newY,
          x: currentBlock.x,
        },
      };
    });
  };

  const landBlock = (state: GameState): GameState => {
    if (!state.fallingBlock) return state;

    const { fallingBlock, grid } = state;
    const landingY = fallingBlock.y;
    const landingX = fallingBlock.x;

    // Oyun bitme kontrolü - eğer en üstteyse
    if (landingY <= 0) {
      // Failure sesini çal
      soundManager.playFailureSound();

      return {
        ...state,
        isGameOver: true,
        fallingBlock: null,
      };
    }

    const newGrid = grid.map((row) => [...row]);

    // Bloğu mevcut pozisyona yerleştir
    newGrid[landingY][landingX].value = fallingBlock.value;

    // Yerleştirilen bloğu kontrol et
    let { scoreGained } = checkExplosions(
      newGrid,
      landingX,
      landingY,
      fallingBlock.value
    );
    let totalScore = scoreGained;

    // Gravity uygula
    let finalGrid = applyGravity(newGrid);

    // Gravity sonrası tüm grid'i kontrol et - yeni eşitlikler oluşmuş olabilir
    let hasMoreExplosions = true;
    while (hasMoreExplosions) {
      hasMoreExplosions = false;
      let explosionScore = 0;

      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          if (finalGrid[y][x].value !== null) {
            // COMBO: Gravity sonrası patlamalar combo sayılır
            let { scoreGained } = checkExplosions(
              finalGrid,
              x,
              y,
              finalGrid[y][x].value!,
              true
            );

            if (scoreGained > 0) {
              explosionScore += scoreGained;
              hasMoreExplosions = true;
              // Gravity tekrar uygula
              finalGrid = applyGravity(finalGrid);
              break; // Bir patlama oldu, döngüyü yeniden başlat
            }
          }
        }
        if (hasMoreExplosions) break; // Dış döngüden de çık
      }
      totalScore += explosionScore;
    }

    return {
      ...state,
      grid: finalGrid,
      fallingBlock: createNewFallingBlock(),
      score: state.score + totalScore,
      selectedOperation: "none",
      level: Math.floor((state.score + totalScore) / 1000) + 1,
      gameSpeed: calculateGameSpeed(
        Math.floor((state.score + totalScore) / 1000) + 1
      ),
    };
  };

  const checkExplosions = (
    grid: any[][],
    x: number,
    y: number,
    value: number,
    isCombo: boolean = false
  ) => {
    let totalScore = 0;
    let cellsToExplode: Set<string> = new Set();
    let hasNeighborMatch = false;
    let hasPrimeExplosion = false;
    let has2Explosion = false;
    let explosionType: "normal" | "prime" | "prime2" | "combo" = "normal";

    // 1. Önce komşu eşitlik kontrolü
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]; // aşağı, yukarı, sağ, sol

    for (const [dx, dy] of directions) {
      const neighborX = x + dx;
      const neighborY = y + dy;

      if (
        neighborX >= 0 &&
        neighborX < GRID_WIDTH &&
        neighborY >= 0 &&
        neighborY < GRID_HEIGHT
      ) {
        const neighborValue = grid[neighborY][neighborX].value;

        if (neighborValue === value) {
          hasNeighborMatch = true;
          // Tüm eşleşen komşuları bul
          const matchingCells = findMatchingNeighbors(grid, x, y, value);
          matchingCells.forEach((cell) => {
            if (cell.value !== null) {
              cellsToExplode.add(`${cell.x}-${cell.y}`);
              // YENİ PUANLAMA: Normal patlama = 30 puan
              totalScore += 30;
            }
          });
          break;
        }
      }
    }

    // 2. Eğer komşu eşleşmesi varsa VE sayı asal ise çapraz patlama da ekle
    if (hasNeighborMatch && isPrime(value)) {
      hasPrimeExplosion = true;
      explosionType = "prime";

      // 2 sayısı özel kontrolü
      if (value === 2) {
        has2Explosion = true;
        explosionType = "prime2";
      }

      const primeCells = findPrimeCrossExplosion(grid, x, y);
      primeCells.forEach((cell) => {
        if (cell.value !== null) {
          cellsToExplode.add(`${cell.x}-${cell.y}`);
          // YENİ PUANLAMA: Asal patlama = kutucuk başına 20 puan
          totalScore += 20;
        }
      });

      // 2 sayısı ise ekstra +150 puan
      if (has2Explosion) {
        totalScore += 200;
      }
    }

    // 3. Combo bonusu
    if (isCombo && cellsToExplode.size > 0) {
      explosionType = "combo";
      totalScore += 100;
    }

    // Explosion animasyonlarını tetikle
    if (cellsToExplode.size > 0) {
      const newExplosions: Explosion[] = Array.from(cellsToExplode).map(
        (key) => {
          const [cellX, cellY] = key.split("-").map(Number);
          return {
            x: cellX,
            y: cellY,
            type: explosionType,
            id: `${Date.now()}-${cellX}-${cellY}`,
          };
        }
      );

      setExplosions((prev) => [...prev, ...newExplosions]);

      // Explosion animasyonlarını belirli bir süre sonra temizle
      setTimeout(() => {
        setExplosions((prev) =>
          prev.filter(
            (explosion) =>
              !newExplosions.some((newExp) => newExp.id === explosion.id)
          )
        );
      }, 1000); // 1 saniye sonra animasyonu temizle
    }

    // Patlamaları uygula
    cellsToExplode.forEach((key) => {
      const [cellX, cellY] = key.split("-").map(Number);
      grid[cellY][cellX].value = null;
    });

    // Patlama seslerini çal
    if (cellsToExplode.size > 0) {
      if (isCombo) {
        soundManager.playComboSound(); // Combo sesi
      } else if (has2Explosion) {
        soundManager.playPrime2Sound(); // 2 sayısı özel sesi
      } else if (hasPrimeExplosion) {
        soundManager.playPrimeExplosionSound(); // Asal patlama sesi
      } else if (hasNeighborMatch) {
        soundManager.playExplosionSound(); // Normal patlama sesi
      }
    }

    return {
      explosions: cellsToExplode.size,
      scoreGained: totalScore,
    };
  };

  const moveBlockLeft = () => {
    if (isPaused) return;
    soundManager.playMoveSound(); // Ses ekle
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
    if (isPaused) return;
    soundManager.playMoveSound(); // Ses ekle
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
    if (isPaused) return;
    soundManager.playDropSound(); // Ses ekle
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
    if (isPaused) return;
    soundManager.playButtonSound(); // Ses ekle
    setGameState((prevState) => ({
      ...prevState,
      selectedOperation:
        prevState.selectedOperation === operation ? "none" : operation,
    }));
  };

  const togglePause = () => {
    soundManager.playButtonSound(); // Ses ekle
    const newPauseState = !isPaused;
    setIsPaused(newPauseState);

    // Müziği pause/resume et
    if (newPauseState) {
      soundManager.pauseBackgroundMusic();
    } else {
      soundManager.playBackgroundMusic();
    }
  };

  if (gameState.isGameOver) {
    return (
      <View style={styles.gameOverContainer}>
        <Text style={styles.gameOverTitle}>Oyun Bitti!</Text>
        <Text style={styles.gameOverScore}>Skorunuz: {gameState.score}</Text>
        <Text style={styles.gameOverTitle}>
          Unvanınız: {getPlayerTitle(gameState.score)}
        </Text>

        {/* Oyun Sonu Butonları */}
        <View style={styles.gameOverButtons}>
          <TouchableOpacity
            style={[styles.gameOverButton, styles.playAgainButton]}
            onPress={() => {
              setGameState({
                grid: createEmptyGrid(),
                fallingBlock: createNewFallingBlock(),
                score: 0,
                isGameOver: false,
                selectedOperation: "none",
                level: 1,
                gameSpeed: calculateGameSpeed(1),
              });
              setExplosions([]); // Explosions'ı da sıfırla
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.gameOverButtonText}>Tekrar Oyna</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameOverButton, styles.menuButton]}
            onPress={onGameEnd}
            activeOpacity={0.7}
          >
            <Text style={styles.gameOverButtonText}>Ana Menü</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isPaused) {
    return (
      <View style={styles.pauseContainer}>
        <Text style={styles.pauseTitle}>Oyun Duraklatıldı</Text>
        <View style={styles.pauseButtons}>
          <TouchableOpacity
            style={[styles.gameOverButton, styles.playAgainButton]}
            onPress={togglePause}
            activeOpacity={0.7}
          >
            <Text style={styles.gameOverButtonText}>Devam Et</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameOverButton, styles.menuButton]}
            onPress={onGameEnd}
            activeOpacity={0.7}
          >
            <Text style={styles.gameOverButtonText}>Ana Menü</Text>
          </TouchableOpacity>
        </View>
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
        onPause={togglePause}
      />

      <View style={styles.gameArea}>
        <GameGrid
          grid={gameState.grid}
          fallingBlock={gameState.fallingBlock}
          explosions={explosions}
        />
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
    paddingVertical: 5, // Padding'i azalttık
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
  pauseContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  pauseTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00d2d3",
    textAlign: "center",
    marginBottom: 40,
  },
  pauseButtons: {
    width: "100%",
    alignItems: "center",
  },
  gameOverButtons: {
    marginTop: 40,
    width: "100%",
    alignItems: "center",
  },
  gameOverButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: "80%",
    alignItems: "center",
    borderWidth: 2,
  },
  playAgainButton: {
    backgroundColor: "#e94560",
    borderColor: "#e94560",
  },
  menuButton: {
    backgroundColor: "transparent",
    borderColor: "#00d2d3",
  },
  gameOverButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default GameScreen;
