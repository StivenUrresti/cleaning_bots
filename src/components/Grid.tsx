import { Cell } from './Cell';
import type { GridState } from '../types/grid';

interface GridProps {
  grid: GridState;
}

export function Grid({ grid }: GridProps) {
  const { cells, robots } = grid;
  const robotByKey = new Map(robots.map((r) => [`${r.x},${r.y}`, r]));

  return (
    <div
      className="inline-grid gap-1.5 p-2 rounded-xl bg-gray-900/80 border border-gray-700/60"
      style={{
        gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((row) =>
        row.map((cell) => (
          <Cell
            key={cell.id}
            cell={cell}
            robot={robotByKey.get(`${cell.x},${cell.y}`) ?? null}
          />
        ))
      )}
    </div>
  );
}
