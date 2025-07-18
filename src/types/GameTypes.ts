export interface GridCell {
  value: number | null;
  id: string;
  x: number;
  y: number;
}

export interface FallingBlock {
  value: number;
  x: number;
  y: number;
  id: string;
}

export interface GameState {
  grid: GridCell[][];
  fallingBlock: FallingBlock | null;
  score: number;
  isGameOver: boolean;
  selectedOperation: 'none' | 'add' | 'subtract' | 'multiply' | 'divide';
  level: number;
  gameSpeed: number;
}

export interface PlayerScore {
  nickname: string;
  score: number;
  date: string;
  title: string;
}

export type Operation = 'none' | 'add' | 'subtract' | 'multiply' | 'divide';

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 16;
export const MIN_NUMBER = 1;
export const MAX_NUMBER = 78;