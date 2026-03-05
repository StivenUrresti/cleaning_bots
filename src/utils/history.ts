import type { RobotStats } from '../types/grid';

export interface SessionRecord {
  id: string;
  timestamp: string;
  cols: number;
  rows: number;
  totalCells: number;
  totalTrash: number;
  robotCount: number;
  speedMs: number;
  robots: RobotStats[];
  avgTrashPerRobot: number;
  /** Number of simulation ticks to clean everything */
  totalTicks: number;
}

const STORAGE_KEY = 'robots_limpiadores_historial';

export function loadHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(record: SessionRecord): void {
  const history = loadHistory();
  history.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildSessionRecord(
  cols: number,
  rows: number,
  speedMs: number,
  stats: RobotStats[],
  totalTicks: number,
): SessionRecord {
  const totalTrash = stats.reduce((s, r) => s + r.trashCollected, 0);
  return {
    id: typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    timestamp: new Date().toISOString(),
    cols,
    rows,
    totalCells: cols * rows,
    totalTrash,
    robotCount: stats.length,
    speedMs,
    robots: stats,
    avgTrashPerRobot: stats.length > 0 ? totalTrash / stats.length : 0,
    totalTicks,
  };
}

/**
 * Find past sessions with the same conditions (cols, rows, trashCount, robotCount).
 */
export function findSimilarSessions(
  cols: number,
  rows: number,
  totalTrash: number,
  robotCount: number,
): SessionRecord[] {
  return loadHistory().filter(
    (s) => s.cols === cols && s.rows === rows && s.totalTrash === totalTrash && s.robotCount === robotCount
  );
}

export function exportHistoryAsText(history: SessionRecord[]): string {
  if (history.length === 0) return 'No hay sesiones guardadas.';

  const sections = history.map((s, idx) => {
    const date = new Date(s.timestamp).toLocaleString('es-CO');
    const robotLines = s.robots.map(
      (r) => `  ${r.id} [${r.color}]: ${r.trashCollected} basuras → ${r.cleanedCells.map((c) => `(${c.x},${c.y})`).join(' → ') || 'ninguna'}`
    );
    return [
      `--- Sesión ${idx + 1} ---`,
      `Fecha: ${date}`,
      `Cuadrícula: ${s.cols}x${s.rows} (${s.totalCells} celdas)`,
      `Basuras: ${s.totalTrash} | Robots: ${s.robotCount} | Velocidad: ${s.speedMs}ms`,
      `Pasos (ticks): ${s.totalTicks ?? '?'}`,
      `Promedio basuras/robot: ${s.avgTrashPerRobot.toFixed(1)}`,
      `Robots:`,
      ...robotLines,
    ].join('\n');
  });

  return [
    '=============================================',
    '  ROBOTS LIMPIADORES - Historial completo',
    '=============================================',
    '',
    `Total de sesiones: ${history.length}`,
    '',
    ...sections.flatMap((s) => [s, '']),
    '=============================================',
  ].join('\n');
}
