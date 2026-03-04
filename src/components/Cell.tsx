import { Bot, Sparkles } from 'lucide-react';
import type { Cell as CellType, Robot } from '../types/grid';

interface CellProps {
  cell: CellType;
  robot?: Robot | null;
  size?: number;
}

export function Cell({ cell, robot, size = 44 }: CellProps) {
  const isDirty = cell.dirty;
  const hasRobot = !!robot;
  const justCleaned = cell.justCleaned;
  const iconSize = Math.max(10, Math.floor(size * 0.55));
  const borderRadius = Math.max(4, Math.min(8, Math.floor(size * 0.18)));

  return (
    <div
      className={`
        relative flex items-center justify-center
        border transition-all duration-300
        ${isDirty ? 'bg-amber-950/40 border-amber-700/50' : ''}
        ${justCleaned ? 'bg-emerald-900/30 border-emerald-600/50 animate-pulse' : ''}
        ${!isDirty && !justCleaned ? 'bg-gray-800/60 border-gray-700/80' : ''}
      `}
      style={{
        width: size,
        height: size,
        borderRadius,
        boxShadow: hasRobot ? `0 0 0 2px ${robot!.color}88, 0 0 12px ${robot!.color}44` : undefined,
      }}
    >
      {isDirty && !hasRobot && (
        <Sparkles
          className="text-amber-400/90 animate-pulse"
          style={{ width: iconSize, height: iconSize }}
        />
      )}
      {hasRobot && (
        <Bot
          className="drop-shadow-lg teleport-in"
          style={{ color: robot!.color, width: iconSize, height: iconSize }}
        />
      )}
    </div>
  );
}
