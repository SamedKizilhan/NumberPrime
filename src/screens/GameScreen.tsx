import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  BackHandler,
  TouchableOpacity,
  SafeAreaView,
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
  FallingBlock,
} from "../types/GameTypes";
import {
  createEmptyGrid,
  createNewFallingBlock,
  createSpecialFallingBlock,
  explodeSpecialBlock,
  performOperation,
  findMatchingNeighbors,
  findPrimeCrossExplosion,
  applyGravity,
  isPrime,
  calculateGameSpeed,
  getPlayerTitleKey,
  getNextTitleRequirement,
} from "../utils/GameUtils";
import SoundManager from "../utils/SoundManager";
import { FirebaseLeaderboard } from "../utils/FirebaseLeaderboard";
import LevelTransition from "../components/LevelTransition";

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
  isCombo?: boolean;
}

const { width, height } = Dimensions.get("window");

const GameScreen: React.FC<GameScreenProps> = ({
  onGameEnd,
  playerNickname,
}) => {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState>({
    grid: createEmptyGrid(),
    fallingBlock: createNewFallingBlock(),
    score: 0,
    isGameOver: false,
    selectedOperation: "none",
    level: 1,
    gameSpeed: calculateGameSpeed(1),
    nextSpecialBlockScore: 1500,
    specialBlockUsedRanges: [],
  });

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [explosionActive, setExplosionActive] = useState<boolean>(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [isProcessingGameOver, setIsProcessingGameOver] = useState(false);
  const [showLevelTransition, setShowLevelTransition] =
    useState<boolean>(false);
  const [transitionLevel, setTransitionLevel] = useState<number>(1);
  const soundManager = SoundManager.getInstance();
  const [isLevelTransitioning, setIsLevelTransitioning] =
    useState<boolean>(false);
  const [specialBlockTimer, setSpecialBlockTimer] =
    useState<NodeJS.Timeout | null>(null);

  const handleLevelTransitionComplete = () => {
    setShowLevelTransition(false);
    setIsLevelTransitioning(false);
  };

  // Seviye geçiş kontrolü
  const prevLevelRef = useRef(gameState.level);

  useEffect(() => {
    if (gameState.level > prevLevelRef.current && gameState.level > 1) {
      // Seviye arttı, transition göster
      setTransitionLevel(gameState.level);
      setShowLevelTransition(true);
      setIsLevelTransitioning(true);
    }
    prevLevelRef.current = gameState.level;
  }, [gameState.level]);

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
    if (
      gameState.isGameOver ||
      isPaused ||
      explosionActive ||
      isLevelTransitioning
    ) {
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
  }, [
    gameState.gameSpeed,
    gameState.isGameOver,
    isPaused,
    explosionActive,
    isLevelTransitioning,
  ]);

  // Geri tuşu kontrolü
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        Alert.alert(t("game.exitGame"), t("game.exitConfirmation"), [
          { text: t("game.no"), style: "cancel" },
          { text: t("game.yes"), onPress: onGameEnd },
        ]);
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

    // ÖNCE özel blok kontrolünü yap (grid silinmeden önce)
    const currentCell = grid[y][x];
    const isSpecialBlock = currentCell.isSpecial;

    console.log(
      "checkExplosions - isSpecialBlock:",
      isSpecialBlock,
      "at",
      x,
      y
    ); // Debug

    // 1. Komşu eşitlik kontrolü
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

    // 3. ÖZEL BLOK KONTROLÜ - Normal patlamalar varsa ve özel bloksa
    if (
      (hasNeighborMatch || hasPrimeExplosion || has2Explosion) &&
      isSpecialBlock
    ) {
      console.log("Special block explosion triggered!"); // Debug

      // Özel blok patlaması: 3 sütunu temizle
      const columnsToExplode = [x - 1, x, x + 1];

      columnsToExplode.forEach((colX) => {
        if (colX >= 0 && colX < GRID_WIDTH) {
          for (let rowY = 0; rowY < GRID_HEIGHT; rowY++) {
            if (grid[rowY][colX].value !== null) {
              cellsToExplode.add(`${colX}-${rowY}`);
              totalScore += grid[rowY][colX].value! * 3; // Özel bonus
            }
          }
        }
      });
    }

    // 4. Combo bonusu
    if (isCombo && cellsToExplode.size > 0) {
      explosionType = "combo";
      totalScore += 150;
    }

    // SON OLARAK patlamaları uygula (grid'den sil)
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
        isCombo: true,
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
    newGrid[fallingBlock.y][fallingBlock.x] = {
      ...newGrid[fallingBlock.y][fallingBlock.x],
      value: fallingBlock.value,
      isSpecial: fallingBlock.isSpecial, // Bu satırı ekleyin
    };

    if (fallingBlock.isSpecial) {
      const timer = setTimeout(() => {
        setGameState((prevState) => {
          // Grid'deki özel bloğu normal bloğa çevir
          const updatedGrid = prevState.grid.map((row) => [...row]);
          updatedGrid[fallingBlock.y][fallingBlock.x] = {
            ...updatedGrid[fallingBlock.y][fallingBlock.x],
            isSpecial: false,
          };

          return {
            ...prevState,
            grid: updatedGrid,
          };
        });
      }, 47000); // 47 saniye

      setSpecialBlockTimer(timer);
    }

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
    const newScore = state.score + totalScore;

    // Özel blok kullanım takibi
    let updatedSpecialBlockUsedRanges = [
      ...(state.specialBlockUsedRanges || []),
    ];
    if (fallingBlock.isSpecial) {
      const currentRange = Math.floor(state.score / 1500);
      if (!updatedSpecialBlockUsedRanges.includes(currentRange)) {
        updatedSpecialBlockUsedRanges.push(currentRange);
      }
    }

    setGameState({
      ...state,
      grid: finalGrid,
      fallingBlock: createNewBlock(newScore, updatedSpecialBlockUsedRanges),
      score: newScore,
      selectedOperation: "none",
      level: Math.floor(newScore / 1500) + 1,
      gameSpeed: calculateGameSpeed(Math.floor(newScore / 1500) + 1),
      specialBlockUsedRanges: updatedSpecialBlockUsedRanges,
    });
  };

  const landBlockAsync = async (state: GameState) => {
    if (!state.fallingBlock || state.isGameOver || isProcessingGameOver) return; // isProcessingGameOver kontrolü eklendi

    const { fallingBlock, grid } = state;
    const landingY = fallingBlock.y;
    const landingX = fallingBlock.x;

    // Oyun bitme kontrolü - eğer en üstteyse
    if (landingY <= 0) {
      setIsProcessingGameOver(true); // Flag set et

      console.log("Game over detected! Setting game over state...");

      // Failure sesini çal
      soundManager.playFailureSound();

      // Skoru kaydet - async olarak
      const finalScore: PlayerScore = {
        id: Date.now().toString(),
        nickname: playerNickname,
        score: state.score,
        date: new Date().toLocaleDateString(),
        title: t(getPlayerTitleKey(state.score)),
      };

      try {
        await FirebaseLeaderboard.saveGlobalScore(finalScore);
        console.log("Score saved successfully");
      } catch (error) {
        console.error("Score save error:", error);
      }

      // State'i güncelle
      setGameState((prevState) => ({
        ...prevState,
        isGameOver: true,
      }));

      setIsProcessingGameOver(false); // İşlem bitti
      return; // Fonksiyondan çık
    }

    const newGrid = grid.map((row) => [...row]);

    // Bloğu mevcut pozisyona yerleştir
    newGrid[landingY][landingX] = {
      ...newGrid[landingY][landingX],
      value: fallingBlock.value,
      isSpecial: fallingBlock.isSpecial, // Bu satırı ekleyin
    };

    if (fallingBlock.isSpecial) {
      const timer = setTimeout(() => {
        setGameState((prevState) => {
          // Grid'deki özel bloğu normal bloğa çevir
          const updatedGrid = prevState.grid.map((row) => [...row]);
          updatedGrid[landingY][landingX] = {
            ...updatedGrid[landingY][landingX],
            isSpecial: false,
          };

          return {
            ...prevState,
            grid: updatedGrid,
          };
        });
      }, 47000); // 47 saniye

      setSpecialBlockTimer(timer);
    }

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
    const newScore = state.score + totalScore;

    // Özel blok kullanım takibi
    let updatedSpecialBlockUsedRanges = [
      ...(state.specialBlockUsedRanges || []),
    ];
    if (fallingBlock.isSpecial) {
      const currentRange = Math.floor(state.score / 1500);
      if (!updatedSpecialBlockUsedRanges.includes(currentRange)) {
        updatedSpecialBlockUsedRanges.push(currentRange);
      }
    }

    setGameState({
      ...state,
      grid: finalGrid,
      fallingBlock: createNewBlock(newScore, updatedSpecialBlockUsedRanges),
      score: newScore,
      selectedOperation: "none",
      level: Math.floor(newScore / 1500) + 1,
      gameSpeed: calculateGameSpeed(Math.floor(newScore / 1500) + 1),
      specialBlockUsedRanges: updatedSpecialBlockUsedRanges,
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
    if (
      isPaused ||
      explosionActive ||
      gameState.isGameOver ||
      isProcessingGameOver
    )
      return;

    soundManager.playDropSound();

    setGameState((prevState) => {
      if (!prevState.fallingBlock || prevState.isGameOver) return prevState;

      const currentBlock = prevState.fallingBlock;
      let newY = currentBlock.y;
      const blockX = currentBlock.x;

      // Normal drop logic
      while (
        newY + 1 < GRID_HEIGHT &&
        prevState.grid[newY + 1][blockX].value === null
      ) {
        newY++;
      }

      if (newY > currentBlock.y) {
        return {
          ...prevState,
          fallingBlock: {
            ...prevState.fallingBlock,
            y: newY,
            x: blockX,
          },
        };
      } else {
        // Sadece landBlockAsync çağır, oyun bitiş kontrolü orada
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

  const createNewBlock = (
    currentScore: number,
    specialBlockUsedRanges: number[] = []
  ): FallingBlock => {
    // Hangi 1500'lük aralıktayız?
    const currentRange = Math.floor(currentScore / 1500);

    // Bu aralıkta daha önce özel blok kullanıldı mı?
    const isSpecialUsedInRange = specialBlockUsedRanges.includes(currentRange);

    // Eğer bu aralığa yeni girdiyse ve özel blok kullanılmadıysa
    if (currentRange > 0 && !isSpecialUsedInRange) {
      console.log("Creating special block!");
      return createSpecialFallingBlock();
    }

    return createNewFallingBlock();
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
    const nextTitleInfo = getNextTitleRequirement(gameState.score);

    return (
      <View style={styles.gameOverContainer}>
        <Text style={styles.gameOverTitle}>{t("game.gameOver")}</Text>
        <Text style={styles.gameOverScore}>
          {t("game.finalScore", { score: gameState.score })}
        </Text>
        <Text style={styles.gameOverTitle}>
          {t(getPlayerTitleKey(gameState.score))}
        </Text>

        {/* Bir sonraki title bilgisi */}
        <View style={styles.nextTitleContainer}>
          {nextTitleInfo.isMaxTitle ? (
            <Text style={styles.nextTitleText}>
              {t("game.maxTitleReached")}
            </Text>
          ) : (
            <>
              <Text style={styles.nextTitleLabel}>
                {t("game.nextTitle")}: {t(nextTitleInfo.nextTitleKey)}
              </Text>
              <Text style={styles.nextTitlePoints}>
                {t("game.pointsToNext", {
                  points: nextTitleInfo.requiredScore - gameState.score,
                })}
              </Text>
            </>
          )}
        </View>

        {/* Oyun Sonu Butonları */}
        <View style={styles.gameOverButtons}>
          <TouchableOpacity
            style={[styles.gameOverButton, styles.playAgainButton]}
            onPress={() => {
              soundManager.startGameMusic();
              setGameState({
                grid: createEmptyGrid(),
                fallingBlock: createNewFallingBlock(),
                score: 0,
                isGameOver: false,
                selectedOperation: "none",
                level: 1,
                gameSpeed: calculateGameSpeed(1),
              });
              setExplosions([]);
              setExplosionActive(false);
              setScorePopups([]);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.gameOverButtonText}>{t("game.playAgain")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameOverButton, styles.menuButton]}
            onPress={onGameEnd}
            activeOpacity={0.7}
          >
            <Text style={styles.gameOverButtonText}>
              {t("game.backToMenu")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isPaused && !isLevelTransitioning) {
    return (
      <View style={styles.pauseContainer}>
        <Text style={styles.pauseTitle}>{t("game.paused")}</Text>
        <View style={styles.pauseButtons}>
          <TouchableOpacity
            style={[styles.gameOverButton, styles.playAgainButton]}
            onPress={togglePause}
            activeOpacity={0.7}
          >
            <Text style={styles.gameOverButtonText}>{t("game.resume")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameOverButton, styles.menuButton]}
            onPress={onGameEnd}
            activeOpacity={0.7}
          >
            <Text style={styles.gameOverButtonText}>
              {t("game.backToMenu")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LevelTransition
        level={transitionLevel}
        isVisible={showLevelTransition}
        onComplete={handleLevelTransitionComplete}
      />
      <GameHeader
        score={gameState.score}
        level={gameState.level}
        playerNickname={playerNickname}
        playerTitle={t(getPlayerTitleKey(gameState.score))}
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
            isCombo={popup.isCombo}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  gameArea: {
    flex: 1,
    justifyContent: "center", // Bu satır eklendi
    alignItems: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
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
    fontSize: 30,
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
  nextTitleContainer: {
    marginVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  nextTitleLabel: {
    color: "#00d2d3",
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  nextTitlePoints: {
    color: "#ffd700",
    fontSize: 22,
    fontWeight: "500",
    textAlign: "center",
  },
  nextTitleText: {
    color: "#ffd700",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default GameScreen;
