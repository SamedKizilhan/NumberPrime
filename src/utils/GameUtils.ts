import { GridCell, FallingBlock, Operation, MIN_NUMBER, MAX_NUMBER, GRID_WIDTH, GRID_HEIGHT } from '../types/GameTypes';

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
        y
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
    id: `falling-${Date.now()}-${Math.random()}`
  };
};

// Matematik işlemi yapma - sadece add ve subtract
export const performOperation = (
  fallingValue: number,
  gridValue: number,
  operation: Operation
): number => {
  switch (operation) {
    case 'add':
      return fallingValue + gridValue;
    case 'subtract':
      return Math.abs(fallingValue - gridValue);
    case 'none':
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
    startX < 0 || startX >= GRID_WIDTH ||
    startY < 0 || startY >= GRID_HEIGHT ||
    visited.has(key) ||
    grid[startY][startX].value !== targetValue
  ) {
    return [];
  }

  visited.add(key);
  const matches = [grid[startY][startX]];
  
  // 4 yönde kontrol et
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  for (const [dx, dy] of directions) {
    const newX = startX + dx;
    const newY = startY + dy;
    matches.push(...findMatchingNeighbors(grid, newX, newY, targetValue, visited));
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

// Oyuncu title'ı belirleme
export const getPlayerTitle = (score: number): string => {
  if (score >= 11000) return 'Prime Master';
  if (score >= 9000) return 'Math Genius';
  if (score >= 7000) return 'Number Sage';
  if (score >= 5000) return 'Calculation Expert';
  if (score >= 3000) return 'Math Enthusiast';
  if (score >= 2000) return 'Number Cruncher';
  if (score >= 1000) return 'Math Student';
  return 'Beginner';
};

// Oyun hızı hesaplama
export const calculateGameSpeed = (level: number): number => {
 const baseSpeed = 900; // 0,9 saniye
 
 if (level <= 5) {
   // Level 1-5: Her level 90ms hızlanma
   const speedIncrease = level * 90;
   return Math.max(200, baseSpeed - speedIncrease);
 } else {
   // Level 5'ten sonra: İlk 5 level için 450ms düşüş + sonraki leveller için 50ms
   const firstFiveLevelsDecrease = 5 * 90; // 450ms
   const additionalLevelsDecrease = (level - 5) * 50;
   const totalDecrease = firstFiveLevelsDecrease + additionalLevelsDecrease;
   return Math.max(200, baseSpeed - totalDecrease);
 }
};