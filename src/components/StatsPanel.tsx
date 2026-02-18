import type { RobotStats } from '../types/grid';

interface StatsPanelProps {
  stats: RobotStats[];
}

export function StatsPanel({ stats }: StatsPanelProps) {
  if (stats.length === 0) return null;

  const totalTrash = stats.reduce((sum, s) => sum + s.trashCollected, 0);
  const totalCells = stats.reduce((sum, s) => sum + s.cellsTraversed, 0);

  return (
    <div className="w-full max-w-md rounded-xl bg-gray-800/80 border border-gray-700/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/60">
        <h3 className="text-sm font-semibold text-gray-200">Estadisticas por robot</h3>
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
            <tr key={s.id} className="border-t border-gray-700/40">
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-gray-300 font-medium">{s.id}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-right text-gray-300">{s.cellsTraversed}</td>
              <td className="px-4 py-2 text-right text-gray-300">{s.trashCollected}</td>
            </tr>
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
