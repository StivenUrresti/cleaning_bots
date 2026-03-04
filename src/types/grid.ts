export interface Cell {
  id: string;
  x: number;
  y: number;
  dirty: boolean;
  justCleaned: boolean;
}

export interface Robot {
  id: string;
  x: number;
  y: number;
  color: string;
  targets: { x: number; y: number }[];
  idle: boolean;
}

export interface RobotStats {
  id: string;
  color: string;
  trashCollected: number;
  cleanedCells: { x: number; y: number }[];
}

export interface GridState {
  cols: number;
  rows: number;
  cells: Cell[][];
  robots: Robot[];
}

export interface GridConfig {
  cols: number;
  rows: number;
  dirtyCount?: number;
}
