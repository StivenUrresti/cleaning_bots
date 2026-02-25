export interface Cell {
  id: string;
  x: number;
  y: number;
  dirty: boolean;
  trailColors: string[];
}

export interface Robot {
  id: string;
  x: number;
  y: number;
  color: string;
  targets: { x: number; y: number }[];
}

export interface RobotStats {
  id: string;
  color: string;
  cellsTraversed: number;
  trashCollected: number;
  visitedCells: { x: number; y: number }[];
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
