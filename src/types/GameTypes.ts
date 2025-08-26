export interface GridCell {
  value: number | null;
  id: string;
  x: number;
  y: number;
  isSpecial?: boolean;
}

export interface FallingBlock {
  value: number;
  x: number;
  y: number;
  id: string;
  isSpecial?: boolean;
  specialTimer?: number; 
}

export interface GameState {
  grid: GridCell[][];
  fallingBlock: FallingBlock | null;
  score: number;
  isGameOver: boolean;
  selectedOperation: "none" | "add" | "subtract";
  level: number;
  gameSpeed: number;
  nextSpecialBlockScore?: number;
  specialBlockUsedRanges?: number[];
}

export interface PlayerScore {
  nickname: string;
  score: number;
  date: string;
  title: string;
  id: string; // Benzersiz ID ekleyelim
}

export type Operation = "none" | "add" | "subtract";

export const GRID_WIDTH = 7;
export const GRID_HEIGHT = 11;
export const MIN_NUMBER = 1;
export const MAX_NUMBER = 47;
