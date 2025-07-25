import {
  GridCell,
  FallingBlock,
  Operation,
  MIN_NUMBER,
  MAX_NUMBER,
  GRID_WIDTH,
  GRID_HEIGHT,
} from "../types/GameTypes";

// Rastgele sayı üretme
export const generateRandomNumber = (): number => {
  return Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
};

// Asal sayı kontrolü
export const isPrime = (num: number): boolean => {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;

  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
};

// Boş grid oluşturma
export const createEmptyGrid = (): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      grid[y][x] = {
        value: null,
        id: `${x}-${y}`,
        x,
        y,
      };
    }
  }
  return grid;
};

// Yeni düşen blok oluşturma
export const createNewFallingBlock = (): FallingBlock => {
  const centerX = Math.floor(GRID_WIDTH / 2); // Her seferinde tam ortada başlasın

  return {
    value: generateRandomNumber(),
    x: centerX,
    y: 0,
    id: `falling-${Date.now()}-${Math.random()}`,
  };
};

// Matematik işlemi yapma - sadece add ve subtract
export const performOperation = (
  fallingValue: number,
  gridValue: number,
  operation: Operation
): number => {
  switch (operation) {
    case "add":
      return fallingValue + gridValue;
    case "subtract":
      return Math.abs(fallingValue - gridValue);
    case "none":
    default:
      return fallingValue;
  }
};

// Çevredeki eşit değerleri bulma
export const findMatchingNeighbors = (
  grid: GridCell[][],
  startX: number,
  startY: number,
  targetValue: number,
  visited: Set<string> = new Set()
): GridCell[] => {
  const key = `${startX}-${startY}`;

  if (
    startX < 0 ||
    startX >= GRID_WIDTH ||
    startY < 0 ||
    startY >= GRID_HEIGHT ||
    visited.has(key) ||
    grid[startY][startX].value !== targetValue
  ) {
    return [];
  }

  visited.add(key);
  const matches = [grid[startY][startX]];

  // 4 yönde kontrol et
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  for (const [dx, dy] of directions) {
    const newX = startX + dx;
    const newY = startY + dy;
    matches.push(
      ...findMatchingNeighbors(grid, newX, newY, targetValue, visited)
    );
  }

  return matches;
};

// Asal sayı çapraz patlaması
export const findPrimeCrossExplosion = (
  grid: GridCell[][],
  primeX: number,
  primeY: number
): GridCell[] => {
  const cells: GridCell[] = [];

  // Yatay çizgi
  for (let x = 0; x < GRID_WIDTH; x++) {
    if (grid[primeY][x].value !== null) {
      cells.push(grid[primeY][x]);
    }
  }

  // Dikey çizgi
  for (let y = 0; y < GRID_HEIGHT; y++) {
    if (grid[y][primeX].value !== null) {
      cells.push(grid[y][primeX]);
    }
  }

  return cells;
};

// Boşlukları doldur (gravity effect)
export const applyGravity = (grid: GridCell[][]): GridCell[][] => {
  const newGrid = createEmptyGrid();

  for (let x = 0; x < GRID_WIDTH; x++) {
    const column = [];

    // Boş olmayan hücreleri topla
    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
      if (grid[y][x].value !== null) {
        column.push(grid[y][x].value);
      }
    }

    // Alt taraftan doldur
    for (let i = 0; i < column.length; i++) {
      const y = GRID_HEIGHT - 1 - i;
      newGrid[y][x].value = column[i];
    }
  }

  return newGrid;
};

export const getPlayerTitleKey = (score: number): string => {
  if (score >= 13000) return "titles.primeMaster";
  if (score >= 10000) return "titles.mathGenius";
  if (score >= 8000) return "titles.numberSage";
  if (score >= 6000) return "titles.calculationExpert";
  if (score >= 4500) return "titles.mathEnthusiast";
  if (score >= 3000) return "titles.numberCruncher";
  if (score >= 1500) return "titles.mathStudent";
  return "titles.beginner";
};

// Oyuncu title'ı belirleme
// export const getPlayerTitle = (score: number): string => {
//   if (score >= 13000) return "Prime Master";
//   if (score >= 10000) return "Math Genius";
//   if (score >= 8000) return "Number Sage";
//   if (score >= 6000) return "Calculation Expert";
//   if (score >= 4500) return "Math Enthusiast";
//   if (score >= 3000) return "Number Cruncher";
//   if (score >= 1500) return "Math Student";
//   return "Beginner";
// };

// Bir sonraki title için gerekli puanı döndüren fonksiyon
export const getNextTitleRequirement = (
  currentScore: number
): { nextTitleKey: string; requiredScore: number; isMaxTitle: boolean } => {
  if (currentScore >= 13000) {
    return {
      nextTitleKey: "titles.primeMaster",
      requiredScore: 13000,
      isMaxTitle: true,
    };
  }
  if (currentScore >= 10000) {
    return {
      nextTitleKey: "titles.primeMaster",
      requiredScore: 13000,
      isMaxTitle: false,
    };
  }
  if (currentScore >= 8000) {
    return {
      nextTitleKey: "titles.mathGenius",
      requiredScore: 10000,
      isMaxTitle: false,
    };
  }
  if (currentScore >= 6000) {
    return {
      nextTitleKey: "titles.numberSage",
      requiredScore: 8000,
      isMaxTitle: false,
    };
  }
  if (currentScore >= 4500) {
    return {
      nextTitleKey: "titles.calculationExpert",
      requiredScore: 6000,
      isMaxTitle: false,
    };
  }
  if (currentScore >= 3000) {
    return {
      nextTitleKey: "titles.mathEnthusiast",
      requiredScore: 4500,
      isMaxTitle: false,
    };
  }
  if (currentScore >= 1500) {
    return {
      nextTitleKey: "titles.numberCruncher",
      requiredScore: 3000,
      isMaxTitle: false,
    };
  }
  return {
    nextTitleKey: "titles.mathStudent",
    requiredScore: 1500,
    isMaxTitle: false,
  };
};

// Oyun hızı hesaplama
export const calculateGameSpeed = (level: number): number => {
  const baseSpeed = 830; // 0,83 saniye

  if (level <= 5) {
    // Level 1-5: Her level 89ms hızlanma
    const speedIncrease = level * 89;
    return Math.max(200, baseSpeed - speedIncrease);
  } else {
    // Level 5'ten sonra: İlk 5 level için 445ms düşüş + sonraki leveller için 37ms
    const firstFiveLevelsDecrease = 5 * 89; // 445ms
    const additionalLevelsDecrease = (level - 5) * 37;
    const totalDecrease = firstFiveLevelsDecrease + additionalLevelsDecrease;
    return Math.max(200, baseSpeed - totalDecrease);
  }
};
