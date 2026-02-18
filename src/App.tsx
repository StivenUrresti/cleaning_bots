import { useMemo, useCallback, useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { CheckCircle2, X } from 'lucide-react';
import { ConfigPanel, SPEED_MS_MIN, SPEED_MS_MAX } from './components/ConfigPanel';
import { Grid } from './components/Grid';
import { StatsPanel } from './components/StatsPanel';
import { useSimulation } from './hooks/useSimulation';
import { generateRandomGrid } from './utils/randomGrid';

const MIN = 3;
const MAX = 16;

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

  const { grid, playing, cleaningComplete, stats, play, pause, reset } = useSimulation(initialGrid, speedMs);
  const [showStats, setShowStats] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const onResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (cleaningComplete) setShowStats(true);
  }, [cleaningComplete]);

  const handleGenerate = useCallback(() => {
    const newGrid = generateRandomGrid({ cols: clamp(cols), rows: clamp(rows) });
    reset(newGrid);
  }, [cols, rows, reset]);

  const handleColsChange = useCallback((v: number) => setCols(clamp(v)), []);
  const handleRowsChange = useCallback((v: number) => setRows(clamp(v)), []);
  const handleSpeedMsChange = useCallback((v: number) => setSpeedMs(Math.min(SPEED_MS_MAX, Math.max(SPEED_MS_MIN, v))), []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-8 px-4">
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
                Todas las celdas están limpias.
              </p>
            </div>
            <StatsPanel stats={stats} />
            <button
              type="button"
              onClick={() => { setShowStats(false); handleGenerate(); }}
              className="mt-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors"
            >
              Nueva simulación
            </button>
          </div>
        </div>
      </div>
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-100 tracking-tight">
          Robots limpiadores
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Elige tamaño de la cuadrícula, genera y pulsa Play.
        </p>
      </header>

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
      />

      <div className="mt-8 flex justify-center overflow-auto">
        {grid ? (
          <Grid grid={grid} />
        ) : (
          <div className="rounded-xl bg-gray-800/60 border border-gray-700/60 px-8 py-12 text-gray-500">
            Genera una cuadrícula para empezar.
          </div>
        )}
      </div>
    </div>
  );
}
