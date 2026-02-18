import { Play, Pause, RotateCcw } from 'lucide-react';
import type { GridState } from '../types/grid';

export const SPEED_MS_MIN = 150;
export const SPEED_MS_MAX = 1200;

interface ConfigPanelProps {
  cols: number;
  rows: number;
  speedMs: number;
  onSpeedMsChange: (v: number) => void;
  onColsChange: (v: number) => void;
  onRowsChange: (v: number) => void;
  onGenerate: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  playing: boolean;
  grid: GridState | null;
}

const MIN = 3;
const MAX = 16;

function clampSpeed(ms: number) {
  return Math.min(SPEED_MS_MAX, Math.max(SPEED_MS_MIN, ms));
}

export function ConfigPanel({
  cols,
  rows,
  speedMs,
  onSpeedMsChange,
  onColsChange,
  onRowsChange,
  onGenerate,
  onPlay,
  onPause,
  onReset,
  playing,
  grid,
}: ConfigPanelProps) {
  const robotCount = grid?.robots.length ?? 0;
  const totalCells = grid ? grid.cols * grid.rows : 0;
  const dirtyCount = grid?.cells.flat().filter((c) => c.dirty).length ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-gray-800/60 border border-gray-700/60">
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-sm font-medium">Celdas X</label>
        <input
          type="number"
          min={MIN}
          max={MAX}
          value={cols}
          onChange={(e) => onColsChange(Number(e.target.value) || MIN)}
          className="w-14 px-2 py-1.5 rounded bg-gray-900 border border-gray-600 text-gray-100 text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-sm font-medium">Celdas Y</label>
        <input
          type="number"
          min={MIN}
          max={MAX}
          value={rows}
          onChange={(e) => onRowsChange(Number(e.target.value) || MIN)}
          className="w-14 px-2 py-1.5 rounded bg-gray-900 border border-gray-600 text-gray-100 text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>
      <button
        type="button"
        onClick={onGenerate}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Generar
      </button>
      <div className="h-6 w-px bg-gray-600" />
      <div className="flex items-center gap-3">
        <label className="text-gray-400 text-sm font-medium whitespace-nowrap">Velocidad</label>
        <input
          type="range"
          min={SPEED_MS_MIN}
          max={SPEED_MS_MAX}
          value={speedMs}
          onChange={(e) => onSpeedMsChange(Number(e.target.value))}
          className="w-24 h-2 rounded-lg appearance-none bg-gray-700 accent-cyan-500"
        />
        <input
          type="number"
          min={SPEED_MS_MIN}
          max={SPEED_MS_MAX}
          value={speedMs}
          onChange={(e) => onSpeedMsChange(clampSpeed(Number(e.target.value) || SPEED_MS_MIN))}
          className="w-16 px-2 py-1.5 rounded bg-gray-900 border border-gray-600 text-gray-100 text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
        <span className="text-gray-500 text-sm">ms</span>
      </div>
      <div className="h-6 w-px bg-gray-600" />
      <button
        type="button"
        onClick={playing ? onPause : onPlay}
        disabled={!grid || grid.robots.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      >
        {playing ? (
          <>
            <Pause className="w-4 h-4" />
            Pausar
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Play
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </button>
      {grid && (
        <div className="text-gray-500 text-sm ml-auto">
          Robots: <span className="text-cyan-400 font-medium">{robotCount}</span>
          {' · '}
          Celdas: <span className="text-gray-300 font-medium">{totalCells}</span>
          {' · '}
          Sucias: <span className="text-amber-400 font-medium">{dirtyCount}</span>
        </div>
      )}
    </div>
  );
}
