import { useMemo } from 'react';
import { Cell } from './Cell';
import type { GridState } from '../types/grid';

interface GridProps {
  grid: GridState;
  containerWidth: number;
  containerHeight: number;
}

export function Grid({ grid, containerWidth, containerHeight }: GridProps) {
  const { cells, robots, cols, rows } = grid;
  const robotByKey = new Map(robots.map((r) => [`${r.x},${r.y}`, r]));

  const cellSize = useMemo(() => {
    const padding = 16;
    const gapPx = Math.max(2, Math.min(6, Math.floor(40 / Math.max(cols, rows))));
    const availW = containerWidth - padding * 2 - gapPx * (cols - 1);
    const availH = containerHeight - padding * 2 - gapPx * (rows - 1);
    const size = Math.max(12, Math.floor(Math.min(availW / cols, availH / rows)));
    return { size, gap: gapPx };
  }, [containerWidth, containerHeight, cols, rows]);

  return (
    <div
      className="inline-grid p-2 rounded-xl bg-gray-900/80 border border-gray-700/60"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize.size}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize.size}px)`,
        gap: `${cellSize.gap}px`,
      }}
    >
      {cells.map((row) =>
        row.map((cell) => (
          <Cell
            key={cell.id}
            cell={cell}
            robot={robotByKey.get(`${cell.x},${cell.y}`) ?? null}
            size={cellSize.size}
          />
        ))
      )}
    </div>
  );
}
