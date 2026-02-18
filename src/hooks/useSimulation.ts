import { useState, useCallback, useRef, useEffect } from 'react';
import type { GridState, Robot, RobotStats } from '../types/grid';

function manhattan(ax: number, ay: number, bx: number, by: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/**
 * Greedy nearest-neighbor assignment: assign every dirty cell to a robot.
 * Each robot gets a queue of targets ordered by visit sequence (nearest first, then nearest to that, etc.).
 */
function assignTargets(
  robots: Robot[],
  dirtyCells: { x: number; y: number }[]
): Map<string, { x: number; y: number }[]> {
  const assignment = new Map<string, { x: number; y: number }[]>();
  for (const r of robots) assignment.set(r.id, []);

  const remaining = [...dirtyCells];

  // Round-robin: each robot picks its nearest unassigned dirty cell, repeat until none left
  while (remaining.length > 0) {
    for (const robot of robots) {
      if (remaining.length === 0) break;
      const queue = assignment.get(robot.id)!;
      const from = queue.length > 0 ? queue[queue.length - 1] : { x: robot.x, y: robot.y };

      let bestIdx = 0;
      let bestDist = manhattan(from.x, from.y, remaining[0].x, remaining[0].y);
      for (let i = 1; i < remaining.length; i++) {
        const d = manhattan(from.x, from.y, remaining[i].x, remaining[i].y);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      queue.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }
  }

  return assignment;
}

/**
 * Move one step toward target (Manhattan movement).
 * Priority: primary axis, secondary axis, then detour moves (perpendicular) to avoid deadlock.
 */
function stepToward(
  rx: number, ry: number,
  tx: number, ty: number,
  occupied: Set<string>,
  cols: number, rows: number,
): { x: number; y: number } | null {
  const dx = tx - rx;
  const dy = ty - ry;

  const moves: { x: number; y: number }[] = [];

  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx !== 0) moves.push({ x: rx + Math.sign(dx), y: ry });
    if (dy !== 0) moves.push({ x: rx, y: ry + Math.sign(dy) });
    // Detour: try perpendicular directions to get around obstacles
    if (dy === 0) {
      moves.push({ x: rx, y: ry + 1 });
      moves.push({ x: rx, y: ry - 1 });
    } else if (dx === 0) {
      moves.push({ x: rx + 1, y: ry });
      moves.push({ x: rx - 1, y: ry });
    }
  } else {
    if (dy !== 0) moves.push({ x: rx, y: ry + Math.sign(dy) });
    if (dx !== 0) moves.push({ x: rx + Math.sign(dx), y: ry });
    if (dx === 0) {
      moves.push({ x: rx + 1, y: ry });
      moves.push({ x: rx - 1, y: ry });
    } else if (dy === 0) {
      moves.push({ x: rx, y: ry + 1 });
      moves.push({ x: rx, y: ry - 1 });
    }
  }

  // Also add any remaining 4-direction moves not yet in the list (full detour fallback)
  const all4 = [
    { x: rx + 1, y: ry }, { x: rx - 1, y: ry },
    { x: rx, y: ry + 1 }, { x: rx, y: ry - 1 },
  ];
  for (const a of all4) {
    if (!moves.some((m) => m.x === a.x && m.y === a.y)) moves.push(a);
  }

  for (const m of moves) {
    if (m.x >= 0 && m.x < cols && m.y >= 0 && m.y < rows && !occupied.has(`${m.x},${m.y}`)) {
      return m;
    }
  }
  return null;
}

const DEFAULT_DELAY_MS = 500;

export function useSimulation(initialGrid: GridState | null, delayMs: number = DEFAULT_DELAY_MS) {
  const [grid, setGrid] = useState<GridState | null>(initialGrid);
  const [playing, setPlaying] = useState(false);
  const [cleaningComplete, setCleaningComplete] = useState(false);
  const [stats, setStats] = useState<RobotStats[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gridRef = useRef<GridState | null>(grid);
  const statsRef = useRef<Map<string, { cellsTraversed: number; trashCollected: number }>>(new Map());

  useEffect(() => { gridRef.current = grid; }, [grid]);

  const setGridFromState = useCallback((state: GridState | null) => { setGrid(state); }, []);

  const initTargets = useCallback((g: GridState): GridState => {
    const dirtyCells: { x: number; y: number }[] = [];
    for (const row of g.cells) {
      for (const c of row) {
        if (c.dirty) dirtyCells.push({ x: c.x, y: c.y });
      }
    }

    const assignment = assignTargets(g.robots, dirtyCells);
    const robots = g.robots.map((r) => ({ ...r, targets: assignment.get(r.id) ?? [] }));

    // Init stats tracking
    const sm = new Map<string, { cellsTraversed: number; trashCollected: number }>();
    for (const r of robots) sm.set(r.id, { cellsTraversed: 0, trashCollected: 0 });
    statsRef.current = sm;

    return { ...g, robots };
  }, []);

  const runOneTick = useCallback(() => {
    const g = gridRef.current;
    if (!g || g.robots.length === 0) return false;

    const robots = g.robots;
    const nextCells = g.cells.map((row) => row.map((c) => ({ ...c, trailColors: [...c.trailColors] })));
    const nextRobots: Robot[] = robots.map((r) => ({ ...r, targets: [...r.targets] }));
    const sm = statsRef.current;

    for (let i = 0; i < robots.length; i++) {
      const robot = nextRobots[i];
      const cell = nextCells[robot.y][robot.x];

      // Mark trail on current cell
      if (!cell.trailColors.includes(robot.color)) {
        cell.trailColors = [...cell.trailColors, robot.color];
      }

      if (cell.dirty) {
        // Clean this cell
        nextCells[robot.y][robot.x] = { ...cell, dirty: false, trailColors: cell.trailColors };
        const s = sm.get(robot.id);
        if (s) s.trashCollected++;
        // Remove this cell from ALL robots' targets (another robot may have it too, or passed through)
        for (const r of nextRobots) {
          r.targets = r.targets.filter((t) => !(t.x === robot.x && t.y === robot.y));
        }
      } else {
        // Purge targets that are already clean (another robot cleaned them en route)
        while (robot.targets.length > 0 && !nextCells[robot.targets[0].y][robot.targets[0].x].dirty) {
          robot.targets.shift();
        }

        const occupied = new Set<string>();
        for (let j = 0; j < nextRobots.length; j++) {
          if (j === i) continue;
          occupied.add(`${nextRobots[j].x},${nextRobots[j].y}`);
        }

        if (robot.targets.length > 0) {
          // Move toward next target
          const target = robot.targets[0];
          const next = stepToward(robot.x, robot.y, target.x, target.y, occupied, g.cols, g.rows);
          if (next) {
            robot.x = next.x;
            robot.y = next.y;
            const s = sm.get(robot.id);
            if (s) s.cellsTraversed++;
          }
        } else {
          // Idle: wander randomly to clear paths for other robots
          const adj = [
            { x: robot.x + 1, y: robot.y }, { x: robot.x - 1, y: robot.y },
            { x: robot.x, y: robot.y + 1 }, { x: robot.x, y: robot.y - 1 },
          ].filter(
            (m) => m.x >= 0 && m.x < g.cols && m.y >= 0 && m.y < g.rows && !occupied.has(`${m.x},${m.y}`)
          );
          if (adj.length > 0) {
            const pick = adj[Math.floor(Math.random() * adj.length)];
            robot.x = pick.x;
            robot.y = pick.y;
            const s = sm.get(robot.id);
            if (s) s.cellsTraversed++;
          }
        }
      }
    }

    // Reassign orphaned dirty cells to idle robots
    const remainingDirty: { x: number; y: number }[] = [];
    const assignedSet = new Set<string>();
    for (const r of nextRobots) {
      for (const t of r.targets) assignedSet.add(`${t.x},${t.y}`);
    }
    for (const row of nextCells) {
      for (const c of row) {
        if (c.dirty && !assignedSet.has(`${c.x},${c.y}`)) {
          remainingDirty.push({ x: c.x, y: c.y });
        }
      }
    }
    if (remainingDirty.length > 0) {
      for (const dirty of remainingDirty) {
        // Find closest idle robot (no targets), or closest robot overall
        let bestRobot: Robot | null = null;
        let bestDist = Infinity;
        for (const r of nextRobots) {
          const d = manhattan(r.x, r.y, dirty.x, dirty.y);
          if (r.targets.length === 0 && d < bestDist) {
            bestDist = d;
            bestRobot = r;
          }
        }
        // If no idle robot, assign to whichever robot is closest
        if (!bestRobot) {
          for (const r of nextRobots) {
            const d = manhattan(r.x, r.y, dirty.x, dirty.y);
            if (d < bestDist) { bestDist = d; bestRobot = r; }
          }
        }
        if (bestRobot) bestRobot.targets.push(dirty);
      }
    }

    const nextState = { ...g, cells: nextCells, robots: nextRobots };
    const hasDirty = nextState.cells.some((row) => row.some((c) => c.dirty));

    setGrid(nextState);

    if (!hasDirty) {
      setPlaying(false);
      setCleaningComplete(true);
      // Build final stats
      const finalStats: RobotStats[] = nextRobots.map((r) => {
        const s = sm.get(r.id) ?? { cellsTraversed: 0, trashCollected: 0 };
        return { id: r.id, color: r.color, cellsTraversed: s.cellsTraversed, trashCollected: s.trashCollected };
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

  return { grid, setGrid: setGridFromState, playing, cleaningComplete, stats, play, pause, reset };
}
