import { useState, useCallback, useRef, useEffect } from 'react';
import type { GridState, Robot, RobotStats } from '../types/grid';
import { findSimilarSessions } from '../utils/history';

function manhattan(ax: number, ay: number, bx: number, by: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

type Pos = { x: number; y: number };

function assignmentCost(assignment: Map<string, Pos[]>): number {
  let max = 0;
  for (const q of assignment.values()) {
    if (q.length > max) max = q.length;
  }
  return max;
}

/**
 * Balanced round-robin nearest-neighbor with per-robot cap.
 */
function assignBalanced(
  robots: Robot[],
  dirtyCells: Pos[],
  cap: number,
): Map<string, Pos[]> {
  const assignment = new Map<string, Pos[]>();
  for (const r of robots) assignment.set(r.id, []);
  const remaining = [...dirtyCells];
  let maxPerRobot = cap;

  while (remaining.length > 0) {
    let assigned = false;
    for (const robot of robots) {
      if (remaining.length === 0) break;
      const queue = assignment.get(robot.id)!;
      if (queue.length >= maxPerRobot) continue;

      const from = queue.length > 0 ? queue[queue.length - 1] : { x: robot.x, y: robot.y };
      let bestIdx = 0;
      let bestDist = manhattan(from.x, from.y, remaining[0].x, remaining[0].y);
      for (let i = 1; i < remaining.length; i++) {
        const d = manhattan(from.x, from.y, remaining[i].x, remaining[i].y);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      queue.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
      assigned = true;
    }
    if (!assigned && remaining.length > 0) maxPerRobot++;
  }

  return assignment;
}

/**
 * Global nearest: each dirty cell goes to the robot whose last
 * assigned position is closest.
 */
function assignGlobalNearest(
  robots: Robot[],
  dirtyCells: Pos[],
): Map<string, Pos[]> {
  const assignment = new Map<string, Pos[]>();
  for (const r of robots) assignment.set(r.id, []);
  const remaining = [...dirtyCells];

  while (remaining.length > 0) {
    let bestRobot = robots[0];
    let bestCellIdx = 0;
    let bestDist = Infinity;

    for (const robot of robots) {
      const queue = assignment.get(robot.id)!;
      const from = queue.length > 0 ? queue[queue.length - 1] : { x: robot.x, y: robot.y };
      for (let i = 0; i < remaining.length; i++) {
        const d = manhattan(from.x, from.y, remaining[i].x, remaining[i].y);
        if (d < bestDist) {
          bestDist = d;
          bestRobot = robot;
          bestCellIdx = i;
        }
      }
    }

    assignment.get(bestRobot.id)!.push(remaining[bestCellIdx]);
    remaining.splice(bestCellIdx, 1);
  }

  return assignment;
}

/**
 * Insert random "search" steps (clean cells) before each real target.
 * Robots that have fewer targets get extra trailing searches to keep
 * everyone busy for the same number of ticks.
 */
function addSearchPadding(
  assignment: Map<string, Pos[]>,
  robots: Robot[],
  cols: number,
  rows: number,
  paddingPerTarget: number,
  dirtySet: Set<string>,
): Map<string, Pos[]> {
  const padded = new Map<string, Pos[]>();

  for (const robot of robots) {
    const targets = assignment.get(robot.id) ?? [];
    const withPadding: Pos[] = [];

    for (const target of targets) {
      for (let p = 0; p < paddingPerTarget; p++) {
        let rx: number, ry: number, attempts = 0;
        do {
          rx = Math.floor(Math.random() * cols);
          ry = Math.floor(Math.random() * rows);
          attempts++;
        } while (dirtySet.has(`${rx},${ry}`) && attempts < 30);
        withPadding.push({ x: rx, y: ry });
      }
      withPadding.push(target);
    }

    padded.set(robot.id, withPadding);
  }

  // Equalize: pad shorter queues so ALL robots move the same number of ticks
  let maxLen = 0;
  for (const q of padded.values()) {
    if (q.length > maxLen) maxLen = q.length;
  }

  for (const robot of robots) {
    const queue = padded.get(robot.id)!;
    while (queue.length < maxLen) {
      let rx: number, ry: number, attempts = 0;
      do {
        rx = Math.floor(Math.random() * cols);
        ry = Math.floor(Math.random() * rows);
        attempts++;
      } while (dirtySet.has(`${rx},${ry}`) && attempts < 30);
      queue.push({ x: rx, y: ry });
    }
  }

  return padded;
}

/**
 * Progressive assignment — all robots always move together.
 *
 * Experience controls search overhead (extra "wandering" steps):
 *   Level 0:  4 search steps before each trash  → many ticks
 *   Level 1:  2 search steps before each trash  → fewer ticks
 *   Level 2:  1 search step before each trash   → even fewer
 *   Level 3+: 0 search steps, optimal strategy  → minimum ticks
 *
 * All robots share work equally and stay busy for the same number of ticks.
 */
function assignTargets(
  robots: Robot[],
  dirtyCells: Pos[],
  cols: number,
  rows: number,
): Map<string, Pos[]> {
  const empty = new Map<string, Pos[]>();
  for (const r of robots) empty.set(r.id, []);
  if (dirtyCells.length === 0 || robots.length === 0) return empty;

  const similar = findSimilarSessions(cols, rows, dirtyCells.length, robots.length);
  const experience = similar.length;

  // Always start with balanced distribution so all robots get targets
  const idealCap = Math.ceil(dirtyCells.length / robots.length);
  let base: Map<string, Pos[]>;

  if (experience >= 3) {
    // Multi-strategy: try several, pick the one with fewest ticks
    const candidates: Map<string, Pos[]>[] = [
      assignBalanced(robots, dirtyCells, idealCap),
      assignGlobalNearest(robots, dirtyCells),
      assignBalanced(robots, dirtyCells, Math.max(1, idealCap - 1)),
      assignBalanced(robots, dirtyCells, idealCap + 1),
    ];

    if (similar.length > 0) {
      const bestPast = similar.reduce((a, b) => (a.totalTicks < b.totalTicks ? a : b));
      const bestMax = Math.max(...bestPast.robots.map((r) => r.trashCollected));
      if (bestMax !== idealCap) {
        candidates.push(assignBalanced(robots, dirtyCells, bestMax));
      }
    }

    base = candidates[0];
    let bestCost = assignmentCost(base);
    for (let i = 1; i < candidates.length; i++) {
      const cost = assignmentCost(candidates[i]);
      if (cost < bestCost) {
        bestCost = cost;
        base = candidates[i];
      }
    }

    return base;
  }

  // Levels 0–2: balanced base + search padding
  base = assignBalanced(robots, dirtyCells, idealCap);

  const paddingLevels = [4, 2, 1];
  const padding = paddingLevels[experience] ?? 0;

  if (padding > 0) {
    const dirtySet = new Set(dirtyCells.map((c) => `${c.x},${c.y}`));
    return addSearchPadding(base, robots, cols, rows, padding, dirtySet);
  }

  return base;
}

const DEFAULT_DELAY_MS = 500;

export function useSimulation(initialGrid: GridState | null, delayMs: number = DEFAULT_DELAY_MS) {
  const [grid, setGrid] = useState<GridState | null>(initialGrid);
  const [playing, setPlaying] = useState(false);
  const [cleaningComplete, setCleaningComplete] = useState(false);
  const [stats, setStats] = useState<RobotStats[]>([]);
  const [tickCount, setTickCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gridRef = useRef<GridState | null>(grid);
  const tickRef = useRef(0);
  const statsRef = useRef<Map<string, { trashCollected: number; cleanedCells: { x: number; y: number }[] }>>(new Map());

  useEffect(() => { gridRef.current = grid; }, [grid]);

  const setGridFromState = useCallback((state: GridState | null) => { setGrid(state); }, []);

  const initTargets = useCallback((g: GridState): GridState => {
    const dirtyCells: { x: number; y: number }[] = [];
    for (const row of g.cells) {
      for (const c of row) {
        if (c.dirty) dirtyCells.push({ x: c.x, y: c.y });
      }
    }

    const assignment = assignTargets(g.robots, dirtyCells, g.cols, g.rows);
    const robots = g.robots.map((r) => ({
      ...r,
      targets: assignment.get(r.id) ?? [],
      idle: (assignment.get(r.id) ?? []).length === 0,
    }));

    const sm = new Map<string, { trashCollected: number; cleanedCells: { x: number; y: number }[] }>();
    for (const r of robots) sm.set(r.id, { trashCollected: 0, cleanedCells: [] });
    statsRef.current = sm;

    return { ...g, robots };
  }, []);

  const runOneTick = useCallback(() => {
    const g = gridRef.current;
    if (!g || g.robots.length === 0) return false;

    tickRef.current++;
    setTickCount(tickRef.current);

    const nextCells = g.cells.map((row) => row.map((c) => ({ ...c, justCleaned: false })));
    const nextRobots: Robot[] = g.robots.map((r) => ({ ...r, targets: [...r.targets] }));
    const sm = statsRef.current;

    for (const robot of nextRobots) {
      if (robot.targets.length === 0) {
        robot.idle = true;
        continue;
      }

      // Teleport to next target
      const target = robot.targets.shift()!;
      robot.x = target.x;
      robot.y = target.y;

      // Clean
      const cell = nextCells[target.y][target.x];
      if (cell.dirty) {
        nextCells[target.y][target.x] = { ...cell, dirty: false, justCleaned: true };
        const s = sm.get(robot.id);
        if (s) {
          s.trashCollected++;
          s.cleanedCells.push({ x: target.x, y: target.y });
        }
      }

      robot.idle = robot.targets.length === 0;
    }

    const nextState = { ...g, cells: nextCells, robots: nextRobots };
    const hasDirty = nextState.cells.some((row) => row.some((c) => c.dirty));
    const allDone = nextRobots.every((r) => r.targets.length === 0);

    setGrid(nextState);

    if (!hasDirty && allDone) {
      setPlaying(false);
      setCleaningComplete(true);
      const finalStats: RobotStats[] = nextRobots.map((r) => {
        const s = sm.get(r.id) ?? { trashCollected: 0, cleanedCells: [] };
        return { id: r.id, color: r.color, trashCollected: s.trashCollected, cleanedCells: s.cleanedCells };
      });
      setStats(finalStats);
    }
    return true;
  }, []);

  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(runOneTick, delayMs);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [playing, delayMs, runOneTick]);

  const play = useCallback(() => {
    if (!grid) return;
    tickRef.current = 0;
    setTickCount(0);
    const withTargets = initTargets(grid);
    setGrid(withTargets);
    gridRef.current = withTargets;
    setCleaningComplete(false);
    setStats([]);
    setPlaying(true);
  }, [grid, initTargets]);

  const pause = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setPlaying(false);
  }, []);

  const reset = useCallback((newGrid: GridState | null) => {
    pause();
    setCleaningComplete(false);
    setStats([]);
    setGrid(newGrid);
  }, [pause]);

  return { grid, setGrid: setGridFromState, playing, cleaningComplete, stats, tickCount, play, pause, reset };
}
