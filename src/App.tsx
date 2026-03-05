import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import Confetti from 'react-confetti';
import { CheckCircle2, X, Download, History, Trash2, RotateCcw, UserMinus } from 'lucide-react';
import { ConfigPanel, SPEED_MS_MIN, SPEED_MS_MAX } from './components/ConfigPanel';
import { Grid } from './components/Grid';
import { StatsPanel } from './components/StatsPanel';
import { useSimulation } from './hooks/useSimulation';
import { generateRandomGrid } from './utils/randomGrid';
import type { SessionRecord } from './utils/history';
import {
  buildSessionRecord,
  saveSession,
  loadHistory,
  clearHistory,
  exportHistoryAsText,
  findSimilarSessions,
} from './utils/history';

const MIN = 2;
const MAX = 100;

function clamp(n: number) {
  return Math.min(MAX, Math.max(MIN, n));
}

export default function App() {
  const [cols, setCols] = useState(6);
  const [rows, setRows] = useState(6);
  const [speedMs, setSpeedMs] = useState(500);

  const initialGrid = useMemo(
    () => generateRandomGrid({ cols: 6, rows: 6 }),
    []
  );

  const { grid, playing, cleaningComplete, stats, tickCount, play, pause, reset } = useSimulation(initialGrid, speedMs);
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const autoSavedRef = useRef(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridArea, setGridArea] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const onResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Measure available space for the grid
  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setGridArea({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-save session when cleaning completes
  useEffect(() => {
    if (cleaningComplete && stats.length > 0 && grid && !autoSavedRef.current) {
      autoSavedRef.current = true;
      const record = buildSessionRecord(grid.cols, grid.rows, speedMs, stats, tickCount);
      saveSession(record);
    }
  }, [cleaningComplete, stats, grid, speedMs, tickCount]);

  useEffect(() => {
    if (cleaningComplete) setShowStats(true);
  }, [cleaningComplete]);

  const handleGenerate = useCallback(() => {
    autoSavedRef.current = false;
    const newGrid = generateRandomGrid({ cols: clamp(cols), rows: clamp(rows) });
    reset(newGrid);
  }, [cols, rows, reset]);

  const handleColsChange = useCallback((v: number) => setCols(clamp(v)), []);
  const handleRowsChange = useCallback((v: number) => setRows(clamp(v)), []);
  const handleSpeedMsChange = useCallback((v: number) => setSpeedMs(Math.min(SPEED_MS_MAX, Math.max(SPEED_MS_MIN, v))), []);

  const handleDownloadHistory = useCallback(() => {
    const history = loadHistory();
    const text = exportHistoryAsText(history);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_robots_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleReplay = useCallback((session: SessionRecord) => {
    autoSavedRef.current = false;
    setCols(session.cols);
    setRows(session.rows);
    setSpeedMs(session.speedMs);
    const newGrid = generateRandomGrid({
      cols: session.cols,
      rows: session.rows,
      dirtyCount: session.totalTrash,
      robotCount: session.robotCount,
    });
    reset(newGrid);
    setShowHistory(false);
  }, [reset]);

  const handleReplayWithFewerRobots = useCallback((session: SessionRecord) => {
    const fewerRobots = session.robotCount <= 1
      ? 1
      : Math.floor(Math.random() * (session.robotCount - 1)) + 1;
    autoSavedRef.current = false;
    setCols(session.cols);
    setRows(session.rows);
    setSpeedMs(session.speedMs);
    const newGrid = generateRandomGrid({
      cols: session.cols,
      rows: session.rows,
      dirtyCount: session.totalTrash,
      robotCount: fewerRobots,
    });
    reset(newGrid);
    setShowHistory(false);
  }, [reset]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setShowHistory(false);
  }, []);

  const historyData = showHistory ? loadHistory() : [];

  // Find previous sessions with same conditions to show improvement
  const previousSimilar = (cleaningComplete && grid && stats.length > 0)
    ? findSimilarSessions(grid.cols, grid.rows,
        stats.reduce((s, r) => s + r.trashCollected, 0),
        stats.length,
      )
    : [];
  // The current session is the last one saved; previous are all before it
  const pastSessions = previousSimilar.length > 1 ? previousSimilar.slice(0, -1) : [];
  const bestPreviousTicks = pastSessions.length > 0
    ? Math.min(...pastSessions.map((s) => s.totalTicks))
    : null;

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      {cleaningComplete && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
        />
      )}

      {/* Side panel - slides in from the right */}
      <div
        className={`fixed top-0 right-0 z-20 h-full w-[480px] max-w-full transform transition-transform duration-300 ease-out ${
          showStats && cleaningComplete ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full bg-gray-900/95 border-l border-cyan-500/30 shadow-2xl shadow-cyan-500/10 flex flex-col p-6 overflow-y-auto">
          <button
            type="button"
            onClick={() => setShowStats(false)}
            className="self-end p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center gap-4 mt-2">
            <div className="rounded-full bg-cyan-500/20 p-4">
              <CheckCircle2 className="h-12 w-12 text-cyan-400" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold tracking-tight text-white">
                ¡Limpieza completada!
              </h2>
              <p className="mt-1 text-gray-400 text-sm">
                Sesión guardada automáticamente.
              </p>

              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="px-5 py-3 rounded-xl bg-gray-800/80 border border-cyan-500/30">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Total de pasos</p>
                  <p className="text-3xl font-bold text-cyan-400">{tickCount}</p>
                </div>
                {bestPreviousTicks !== null && (
                  <p className={`text-sm font-medium ${
                    tickCount < bestPreviousTicks
                      ? 'text-emerald-400'
                      : tickCount === bestPreviousTicks
                        ? 'text-gray-400'
                        : 'text-amber-400'
                  }`}>
                    {tickCount < bestPreviousTicks
                      ? `Mejoró ${Math.round((1 - tickCount / bestPreviousTicks) * 100)}% respecto al mejor anterior (${bestPreviousTicks} pasos)`
                      : tickCount === bestPreviousTicks
                        ? `Mismo resultado que el mejor anterior (${bestPreviousTicks} pasos)`
                        : `Mejor anterior: ${bestPreviousTicks} pasos`
                    }
                  </p>
                )}
              </div>
            </div>
            <StatsPanel stats={stats} />
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              <button
                type="button"
                onClick={handleDownloadHistory}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar historial
              </button>
              <button
                type="button"
                onClick={() => { setShowStats(false); handleGenerate(); }}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors"
              >
                Nueva simulación
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History panel */}
      <div
        className={`fixed top-0 left-0 z-20 h-full w-[480px] max-w-full transform transition-transform duration-300 ease-out ${
          showHistory ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full bg-gray-900/95 border-r border-cyan-500/30 shadow-2xl shadow-cyan-500/10 flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              Historial de ejecuciones
            </h2>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {historyData.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay sesiones guardadas aún.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {historyData.map((s, idx) => {
                const similars = historyData.filter(
                  (h) => h.cols === s.cols && h.rows === s.rows && h.totalTrash === s.totalTrash && h.robotCount === s.robotCount
                );
                const runNumber = similars.indexOf(s) + 1;
                const isRepeat = similars.length > 1;
                const prevInGroup = similars[similars.indexOf(s) - 1];

                return (
                  <div key={s.id} className={`rounded-lg bg-gray-800/80 border p-3 ${isRepeat ? 'border-cyan-700/40' : 'border-gray-700/60'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-cyan-400">Sesión {idx + 1}</span>
                        {isRepeat && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300 font-medium">
                            #{runNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(s.timestamp).toLocaleString('es-CO')}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {s.cols}x{s.rows} · {s.totalTrash} basuras · {s.robotCount} robots · {s.speedMs}ms
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-300">
                        Pasos: <span className="font-bold text-cyan-400">{s.totalTicks ?? '?'}</span>
                      </span>
                      {prevInGroup && s.totalTicks != null && prevInGroup.totalTicks != null && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          s.totalTicks < prevInGroup.totalTicks
                            ? 'bg-emerald-900/40 text-emerald-400'
                            : s.totalTicks === prevInGroup.totalTicks
                              ? 'bg-gray-700 text-gray-400'
                              : 'bg-amber-900/40 text-amber-400'
                        }`}>
                          {s.totalTicks < prevInGroup.totalTicks
                            ? `↓ ${Math.round((1 - s.totalTicks / prevInGroup.totalTicks) * 100)}% mejor`
                            : s.totalTicks === prevInGroup.totalTicks
                              ? '= igual'
                              : `↑ ${Math.round((s.totalTicks / prevInGroup.totalTicks - 1) * 100)}% más`
                          }
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {s.robots.map((r) => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
                          style={{ backgroundColor: r.color + '25', color: r.color }}
                        >
                          {r.id}: {r.trashCollected}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleReplay(s)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-800/40 hover:bg-cyan-700/50 text-cyan-300 text-[11px] font-medium transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Repetir condiciones
                      </button>
                      {s.robotCount > 1 && (
                        <button
                          type="button"
                          onClick={() => handleReplayWithFewerRobots(s)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-800/40 hover:bg-amber-700/50 text-amber-300 text-[11px] font-medium transition-colors"
                        >
                          <UserMinus className="w-3 h-3" />
                          Menos robots (aleatorio, 1 a {s.robotCount - 1})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleDownloadHistory}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .txt
            </button>
            {historyData.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-300 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar historial
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="shrink-0 py-4 text-center">
        <h1 className="text-2xl font-semibold text-gray-100 tracking-tight">
          Robots limpiadores
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Elige tamaño de la cuadrícula, genera y pulsa Play.
        </p>
      </header>

      {/* Config */}
      <div className="shrink-0 px-4 pb-3">
        <ConfigPanel
          cols={cols}
          rows={rows}
          speedMs={speedMs}
          onSpeedMsChange={handleSpeedMsChange}
          onColsChange={handleColsChange}
          onRowsChange={handleRowsChange}
          onGenerate={handleGenerate}
          onPlay={play}
          onPause={pause}
          onReset={() => handleGenerate()}
          playing={playing}
          grid={grid}
          onShowHistory={() => setShowHistory(true)}
          historyCount={loadHistory().length}
        />
      </div>

      {/* Grid area fills remaining space */}
      <div
        ref={gridContainerRef}
        className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4"
      >
        {grid ? (
          <Grid grid={grid} containerWidth={gridArea.w} containerHeight={gridArea.h} />
        ) : (
          <div className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-8 py-12 text-gray-500">
            Genera una cuadrícula para empezar.
          </div>
        )}
      </div>
    </div>
  );
}
