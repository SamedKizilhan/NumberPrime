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
import GameGrid, { CELL_SIZE } from "../components/GameGrid";
import GameControls from "../components/GameControls";
import GameHeader from "../components/GameHeader";
import ScorePopup from "../components/ScorePopup";
import {
  GameState,
  Operation,
  GRID_WIDTH,
  GRID_HEIGHT,
  PlayerScore,
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
import { saveScore } from "../utils/StorageUtils";

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

// ScorePopup interface tanımı
interface ScorePopup {
  score: number;
  x: number;
  y: number;
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
  const [explosionActive, setExplosionActive] = useState<boolean>(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const soundManager = SoundManager.getInstance();

  // Ses sistemini başlat
  useEffect(() => {
    const initializeSound = async () => {
      await soundManager.initialize();
      await soundManager.startGameMusic(); // playBackgroundMusic() yerine
    };

    initializeSound();

    // Cleanup - sadece müziği durdur
    return () => {
      soundManager.pauseBackgroundMusic();
    };
  }, []);

  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Oyun döngüsü
  useEffect(() => {
    if (gameState.isGameOver || isPaused || explosionActive) {
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
  }, [gameState.gameSpeed, gameState.isGameOver, isPaused, explosionActive]);

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
    if (explosionActive) return; // Explosion aktifken hiçbir şey yapma

    setGameState((prevState) => {
      if (!prevState.fallingBlock || prevState.isGameOver) return prevState;

      const currentBlock = prevState.fallingBlock;
      const newY = currentBlock.y + 1;

      // Alt sınıra ulaştı mı?
      if (newY >= GRID_HEIGHT) {
        // Async landBlock çağır
        landBlockAsync(prevState);
        return prevState; // Şimdilik eski state'i döndür
      }

      // Hedef hücre dolu mu?
      if (prevState.grid[newY][currentBlock.x].value !== null) {
        // Dolu hücreye iniyor - işlem kontrolü yap
        const { selectedOperation } = prevState;

        if (selectedOperation === "add" || selectedOperation === "subtract") {
          // Async işlem yap
          handleOperationAsync(prevState, selectedOperation, newY);
          return prevState; // Şimdilik eski state'i döndür
        } else {
          // İşlem yok - blok mevcut pozisyonda dur
          landBlockAsync(prevState);
          return prevState;
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
              // YENİ PUANLAMA: Normal patlama = 40 puan
              totalScore += 40;
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
          // YENİ PUANLAMA: Asal patlama = kutucuk başına 30 puan
          totalScore += 30;
        }
      });

      // 2 sayısı ise ekstra +200 puan
      if (has2Explosion) {
        totalScore += 200;
      }
    }

    // 3. Combo bonusu
    if (isCombo && cellsToExplode.size > 0) {
      explosionType = "combo";
      totalScore += 150;
    }

    // Patlamaları uygula (grid'den sil)
    cellsToExplode.forEach((key) => {
      const [cellX, cellY] = key.split("-").map(Number);
      grid[cellY][cellX].value = null;
    });

    return {
      scoreGained: totalScore,
      cellsToExplode,
      explosionType,
      hasNeighborMatch,
      hasPrimeExplosion,
      has2Explosion,
    };
  };

  const triggerExplosions = async (
    cellsToExplode: Set<string>,
    explosionType: "normal" | "prime" | "prime2" | "combo",
    hasNeighborMatch: boolean,
    hasPrimeExplosion: boolean,
    has2Explosion: boolean,
    explosionX?: number,
    explosionY?: number
  ): Promise<void> => {
    if (cellsToExplode.size === 0) return;

    setExplosionActive(true);

    const newExplosions: Explosion[] = Array.from(cellsToExplode).map((key) => {
      const [cellX, cellY] = key.split("-").map(Number);
      return {
        x: cellX,
        y: cellY,
        type: explosionType,
        id: `${Date.now()}-${cellX}-${cellY}`,
      };
    });

    setExplosions((prev) => [...prev, ...newExplosions]);

    // Bonus puanları için popup göster
    if (has2Explosion && explosionX !== undefined && explosionY !== undefined) {
      const popup: ScorePopup = {
        score: 200,
        x: explosionX,
        y: explosionY,
        id: `popup-${Date.now()}-200`,
      };
      setScorePopups((prev) => [...prev, popup]);
    }

    if (
      explosionType === "combo" &&
      explosionX !== undefined &&
      explosionY !== undefined
    ) {
      const popup: ScorePopup = {
        score: 150,
        x: explosionX,
        y: explosionY,
        id: `popup-${Date.now()}-150`,
      };
      setScorePopups((prev) => [...prev, popup]);
    }

    // Patlama seslerini çal
    if (explosionType === "combo") {
      soundManager.playComboSound();
    } else if (has2Explosion) {
      soundManager.playPrime2Sound();
    } else if (hasPrimeExplosion) {
      soundManager.playPrimeExplosionSound();
    } else if (hasNeighborMatch) {
      soundManager.playExplosionSound();
    }

    // Explosion animasyonlarının bitmesini bekle
    const maxDuration =
      explosionType === "prime" || explosionType === "prime2" ? 500 : 400;
    await new Promise((resolve) => setTimeout(resolve, maxDuration + 100)); // 100ms extra buffer

    // Animasyonları temizle
    setExplosions((prev) =>
      prev.filter(
        (explosion) =>
          !newExplosions.some((newExp) => newExp.id === explosion.id)
      )
    );

    setExplosionActive(false);
  };

  const handleOperationAsync = async (
    state: GameState,
    selectedOperation: Operation,
    newY: number
  ) => {
    const { fallingBlock } = state;
    if (!fallingBlock) return;

    // İşlem yap ve her iki bloğu da yerleştir
    const newGrid = state.grid.map((row) => [...row]);
    const existingValue = newGrid[newY][fallingBlock.x].value;

    const resultValue = performOperation(
      fallingBlock.value,
      existingValue!,
      selectedOperation
    );

    // Alt hücreye işlem sonucunu yaz
    newGrid[newY][fallingBlock.x].value = resultValue;
    // Üst hücreye düşen bloğun değerini yaz
    newGrid[fallingBlock.y][fallingBlock.x].value = fallingBlock.value;

    // İlk patlama kontrolü
    const firstExplosion = checkExplosions(
      newGrid,
      fallingBlock.x,
      newY,
      resultValue
    );

    let totalScore = firstExplosion.scoreGained;

    // Explosion animasyonlarını tetikle ve bekle
    await triggerExplosions(
      firstExplosion.cellsToExplode,
      firstExplosion.explosionType,
      firstExplosion.hasNeighborMatch,
      firstExplosion.hasPrimeExplosion,
      firstExplosion.has2Explosion,
      fallingBlock.x,
      newY
    );

    // Gravity uygula
    let finalGrid = applyGravity(newGrid);

    // Combo patlamaları kontrol et
    while (true) {
      let hasMoreExplosions = false;

      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          if (finalGrid[y][x].value !== null) {
            const comboResult = checkExplosions(
              finalGrid,
              x,
              y,
              finalGrid[y][x].value!,
              true
            );

            if (comboResult.scoreGained > 0) {
              totalScore += comboResult.scoreGained;
              hasMoreExplosions = true;

              // Combo explosion animasyonlarını tetikle ve bekle
              await triggerExplosions(
                comboResult.cellsToExplode,
                comboResult.explosionType,
                comboResult.hasNeighborMatch,
                comboResult.hasPrimeExplosion,
                comboResult.has2Explosion,
                x,
                y
              );

              // Gravity tekrar uygula
              finalGrid = applyGravity(finalGrid);
              break;
            }
          }
        }
        if (hasMoreExplosions) break;
      }

      if (!hasMoreExplosions) break;
    }

    // Final state güncelle
    setGameState({
      ...state,
      grid: finalGrid,
      fallingBlock: createNewFallingBlock(),
      score: state.score + totalScore,
      selectedOperation: "none",
      level: Math.floor((state.score + totalScore) / 1000) + 1,
      gameSpeed: calculateGameSpeed(
        Math.floor((state.score + totalScore) / 1000) + 1
      ),
    });
  };

  const landBlockAsync = async (state: GameState) => {
    if (!state.fallingBlock) return;

    const { fallingBlock, grid } = state;
    const landingY = fallingBlock.y;
    const landingX = fallingBlock.x;

    // Oyun bitme kontrolü - eğer en üstteyse
    if (landingY <= 0) {
      // Failure sesini çal
      soundManager.playFailureSound();

      // Skoru kaydet
      const finalScore: PlayerScore = {
        id: Date.now().toString(),
        nickname: playerNickname,
        score: state.score,
        date: new Date().toLocaleDateString(),
        title: getPlayerTitle(state.score),
      };

      saveScore(finalScore);

      setGameState({
        ...state,
        isGameOver: true,
        fallingBlock: null,
      });
      return;
    }

    const newGrid = grid.map((row) => [...row]);

    // Bloğu mevcut pozisyona yerleştir
    newGrid[landingY][landingX].value = fallingBlock.value;

    // İlk patlama kontrolü
    const firstExplosion = checkExplosions(
      newGrid,
      landingX,
      landingY,
      fallingBlock.value
    );

    let totalScore = firstExplosion.scoreGained;

    // Explosion animasyonlarını tetikle ve bekle
    await triggerExplosions(
      firstExplosion.cellsToExplode,
      firstExplosion.explosionType,
      firstExplosion.hasNeighborMatch,
      firstExplosion.hasPrimeExplosion,
      firstExplosion.has2Explosion,
      landingX,
      landingY
    );

    // Gravity uygula
    let finalGrid = applyGravity(newGrid);

    // Combo patlamaları kontrol et
    while (true) {
      let hasMoreExplosions = false;

      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          if (finalGrid[y][x].value !== null) {
            const comboResult = checkExplosions(
              finalGrid,
              x,
              y,
              finalGrid[y][x].value!,
              true
            );

            if (comboResult.scoreGained > 0) {
              totalScore += comboResult.scoreGained;
              hasMoreExplosions = true;

              // Combo explosion animasyonlarını tetikle ve bekle
              await triggerExplosions(
                comboResult.cellsToExplode,
                comboResult.explosionType,
                comboResult.hasNeighborMatch,
                comboResult.hasPrimeExplosion,
                comboResult.has2Explosion,
                x,
                y
              );

              // Gravity tekrar uygula
              finalGrid = applyGravity(finalGrid);
              break;
            }
          }
        }
        if (hasMoreExplosions) break;
      }

      if (!hasMoreExplosions) break;
    }

    // Final state güncelle
    setGameState({
      ...state,
      grid: finalGrid,
      fallingBlock: createNewFallingBlock(),
      score: state.score + totalScore,
      selectedOperation: "none",
      level: Math.floor((state.score + totalScore) / 1000) + 1,
      gameSpeed: calculateGameSpeed(
        Math.floor((state.score + totalScore) / 1000) + 1
      ),
    });
  };

  const moveBlockLeft = () => {
    if (isPaused || explosionActive) return;
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
    if (isPaused || explosionActive) return;
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
    if (isPaused || explosionActive) return;
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
        landBlockAsync(prevState);
        return prevState;
      }
    });
  };

  const selectOperation = (operation: Operation) => {
    if (isPaused || explosionActive) return;
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
              setExplosionActive(false); // Explosion active'i de sıfırla
              setScorePopups([]); // Score popup'ları da sıfırla
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

        {/* Score Popup'ları */}
        {scorePopups.map((popup) => (
          <ScorePopup
            key={popup.id}
            score={popup.score}
            x={popup.x}
            y={popup.y}
            cellSize={CELL_SIZE}
            onComplete={() => {
              setScorePopups((prev) => prev.filter((p) => p.id !== popup.id));
            }}
          />
        ))}
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
