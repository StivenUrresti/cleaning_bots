import type { Cell, Robot, GridState } from '../types/grid';

const ROBOT_COLORS = [
  '#22d3ee', '#f472b6', '#a78bfa', '#34d399',
  '#fb923c', '#facc15', '#f87171', '#60a5fa',
  '#c084fc', '#2dd4bf', '#e879f9', '#4ade80',
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateRandomGrid(config: {
  cols: number;
  rows: number;
  dirtyCount?: number;
}): GridState {
  const { cols, rows } = config;
  const totalCells = cols * rows;

  const positions: { x: number; y: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      positions.push({ x, y });
    }
  }
  const shuffled = shuffle(positions);

  // 1) Dirty: strictly < 50% of total cells
  const maxDirty = Math.floor(totalCells / 2) - 1;
  const dirtyCount = config.dirtyCount != null
    ? Math.min(config.dirtyCount, maxDirty)
    : Math.max(1, Math.floor(Math.random() * maxDirty) + 1);

  const dirtyPositions = new Set(
    shuffled.slice(0, Math.min(dirtyCount, maxDirty)).map((p) => `${p.x},${p.y}`)
  );
  const actualDirty = dirtyPositions.size;

  // 2) Robots: between 1 and floor(dirtyCount / 2), never more than dirtyCount
  const maxRobots = Math.max(1, Math.floor(actualDirty / 2));
  const numRobots = Math.max(1, Math.floor(Math.random() * maxRobots) + 1);

  // 3) Place robots on clean cells only
  const cleanPositions = shuffled.filter((p) => !dirtyPositions.has(`${p.x},${p.y}`));
  const robotCount = Math.min(numRobots, cleanPositions.length);
  const robotPositions = cleanPositions.slice(0, robotCount);

  // Build cells
  const cells: Cell[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < cols; x++) {
      const key = `${x},${y}`;
      row.push({ id: key, x, y, dirty: dirtyPositions.has(key), trailColors: [] });
    }
    cells.push(row);
  }

  // Build robots with unique colors
  const robots: Robot[] = robotPositions.map((p, i) => ({
    id: `robot-${i}`,
    x: p.x,
    y: p.y,
    color: ROBOT_COLORS[i % ROBOT_COLORS.length],
    targets: [],
  }));

  return { cols, rows, cells, robots };
}
