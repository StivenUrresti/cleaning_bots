import { Bot, Sparkles } from 'lucide-react';
import type { Cell as CellType, Robot } from '../types/grid';

interface CellProps {
  cell: CellType;
  robot?: Robot | null;
}

export function Cell({ cell, robot }: CellProps) {
  const isDirty = cell.dirty;
  const hasRobot = !!robot;
  const trailColors = cell.trailColors;

  // Build trail background: blend the last trail color at low opacity
  const trailBg = trailColors.length > 0
    ? trailColors[trailColors.length - 1] + '30' // hex with ~19% alpha
    : undefined;

  return (
    <div
      className={`
        relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg
        border border-gray-700/80 transition-all duration-300
        ${isDirty ? 'bg-amber-950/40 border-amber-700/50' : 'bg-gray-800/60'}
      `}
      style={{
        backgroundColor: !isDirty && trailBg ? trailBg : undefined,
        boxShadow: hasRobot ? `0 0 0 2px ${robot!.color}66, 0 0 8px ${robot!.color}33` : undefined,
      }}
    >
      {/* Trail dots for multi-robot overlap */}
      {trailColors.length > 1 && !isDirty && (
        <div className="absolute bottom-0.5 left-0.5 flex gap-0.5">
          {trailColors.slice(0, 4).map((c, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
      {isDirty && (
        <Sparkles
          className="absolute w-5 h-5 text-amber-400/90 animate-pulse"
          aria-label="Sucio"
        />
      )}
      {hasRobot && (
        <Bot
          className="w-7 h-7 drop-shadow-md animate-[pulse_2s_ease-in-out_infinite]"
          style={{ color: robot!.color }}
          aria-label="Robot"
        />
      )}
    </div>
  );
}
