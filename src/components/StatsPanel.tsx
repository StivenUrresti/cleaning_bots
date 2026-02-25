import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { RobotStats } from '../types/grid';

interface StatsPanelProps {
  stats: RobotStats[];
}

function CellList({ label, cells, color }: { label: string; cells: { x: number; y: number }[]; color: string }) {
  if (cells.length === 0) return null;
  return (
    <div className="mt-1">
      <span className="text-gray-500 text-xs">{label}:</span>
      <div className="flex flex-wrap gap-1 mt-0.5">
        {cells.map((c, i) => (
          <span
            key={i}
            className="inline-block px-1.5 py-0.5 rounded text-xs font-mono"
            style={{ backgroundColor: color + '25', color }}
          >
            ({c.x},{c.y})
          </span>
        ))}
      </div>
    </div>
  );
}

function RobotRow({ s }: { s: RobotStats }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="border-t border-gray-700/40 cursor-pointer hover:bg-gray-700/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-gray-300 font-medium">{s.id}</span>
            {open
              ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
              : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            }
          </div>
        </td>
        <td className="px-4 py-2 text-right text-gray-300">{s.cellsTraversed}</td>
        <td className="px-4 py-2 text-right text-gray-300">{s.trashCollected}</td>
      </tr>
      {open && (
        <tr className="border-t border-gray-700/20">
          <td colSpan={3} className="px-4 py-2 bg-gray-800/40">
            {s.visitedCells.length > 0 && (
              <div className="mt-1">
                <span className="text-gray-500 text-xs">Inicio:</span>
                <span
                  className="inline-block ml-1 px-1.5 py-0.5 rounded text-xs font-mono font-bold"
                  style={{ backgroundColor: s.color + '35', color: s.color }}
                >
                  ({s.visitedCells[0].x},{s.visitedCells[0].y})
                </span>
              </div>
            )}
            <CellList label={`Recorrido (${s.cellsTraversed} movimientos)`} cells={s.visitedCells.slice(1)} color={s.color} />
            <CellList label={`Basuras limpiadas (${s.trashCollected})`} cells={s.cleanedCells} color={s.color} />
          </td>
        </tr>
      )}
    </>
  );
}

export function StatsPanel({ stats }: StatsPanelProps) {
  if (stats.length === 0) return null;

  const totalTrash = stats.reduce((sum, s) => sum + s.trashCollected, 0);
  const totalCells = stats.reduce((sum, s) => sum + s.cellsTraversed, 0);

  return (
    <div className="w-full rounded-xl bg-gray-800/80 border border-gray-700/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/60">
        <h3 className="text-sm font-semibold text-gray-200">Estadisticas por robot</h3>
        <p className="text-xs text-gray-500 mt-0.5">Haz clic en un robot para ver el detalle</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wider">
            <th className="px-4 py-2 text-left">Robot</th>
            <th className="px-4 py-2 text-right">Celdas recorridas</th>
            <th className="px-4 py-2 text-right">Basuras recolectadas</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <RobotRow key={s.id} s={s} />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-600/60">
            <td className="px-4 py-2 text-gray-400 font-semibold">Total</td>
            <td className="px-4 py-2 text-right text-gray-200 font-semibold">{totalCells}</td>
            <td className="px-4 py-2 text-right text-gray-200 font-semibold">{totalTrash}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
