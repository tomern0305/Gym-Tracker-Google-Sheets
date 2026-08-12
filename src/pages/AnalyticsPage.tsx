import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart as ChartIcon, 
  Trophy, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Dumbbell
} from 'lucide-react';
import { getExercises, getWorkoutLogs } from '../services/storage';
import type { StrengthSet } from '../types';

// Color palette for set lines in quiet luxury palette
const SET_COLORS = [
  '#6B8E78', // Set 1: Sage Green
  '#5C809B', // Set 2: Slate Blue
  '#D4A373', // Set 3: Warm Amber
  '#E07A5F', // Set 4: Terracotta
  '#9A8C98', // Set 5: Muted Violet
  '#81D4FA', // Set 6+: Cyan Accent
];

interface SessionPoint {
  date: string;
  formattedDate: string;
  workoutType: string;
  sets: StrengthSet[];
  maxWeight: number;
  maxReps: number;
  totalVolume: number;
}

function formatGraphDate(dateStr: string): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim();

  // Try Date object parsing first (handles ISO, GMT, UTC, standard date strings)
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }

  // Try matching month names in raw strings (e.g. "Wed Aug 12 2026 ...")
  const monthMatch = str.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})/i);
  if (monthMatch) {
    return `${monthMatch[1]} ${monthMatch[2]}`;
  }

  // YYYY-MM-DD pattern
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = parseInt(ymd[2], 10) - 1;
    return `${months[idx] || ''} ${parseInt(ymd[3], 10)}`;
  }

  return str.slice(0, 6);
}

export const AnalyticsPage: React.FC = () => {
  const allExercises = getExercises();
  const [logs, setLogs] = useState(getWorkoutLogs());

  // Listen to realtime storage updates
  useEffect(() => {
    const handleUpdate = () => {
      setLogs(getWorkoutLogs());
    };
    window.addEventListener('aura_data_updated', handleUpdate);
    return () => window.removeEventListener('aura_data_updated', handleUpdate);
  }, []);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    allExercises[0]?.id || ''
  );
  const [metricMode, setMetricMode] = useState<'sets' | 'max' | 'volume'>('sets');
  const [activePoint, setActivePoint] = useState<{ session: SessionPoint; setIdx?: number } | null>(null);

  const selectedExercise = allExercises.find(e => e.id === selectedExerciseId) || allExercises[0];

  // Build chronological session points for the selected exercise
  const historyData: SessionPoint[] = useMemo(() => {
    if (!selectedExercise) return [];

    // Filter logs containing this exercise and sort oldest -> newest for line chart
    const matched = logs
      .filter(log =>
        log.exercises && log.exercises.some(
          e => e.exerciseName.toLowerCase().trim() === selectedExercise.name.toLowerCase().trim()
        )
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return matched.map(log => {
      const exLog = log.exercises.find(
        e => e.exerciseName.toLowerCase().trim() === selectedExercise.name.toLowerCase().trim()
      )!;

      const sets = exLog.sets || [];
      const completedSets = sets.filter(s => s.completed);
      const activeSets = completedSets.length > 0 ? completedSets : sets;

      const maxWeight = activeSets.length > 0 ? Math.max(...activeSets.map(s => s.weightKg)) : 0;
      const maxReps = activeSets.length > 0 ? Math.max(...activeSets.map(s => s.reps)) : 0;
      const totalVolume = activeSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

      const formattedDate = formatGraphDate(log.date);

      return {
        date: log.date,
        formattedDate,
        workoutType: log.workoutType,
        sets,
        maxWeight,
        maxReps,
        totalVolume
      };
    });
  }, [logs, selectedExercise]);

  // Overall PR & Stats
  const prWeight = historyData.length > 0 ? Math.max(...historyData.map(h => h.maxWeight)) : 0;
  const firstSession = historyData[0];
  const lastSession = historyData[historyData.length - 1];

  const weightGain = (firstSession && lastSession)
    ? lastSession.maxWeight - firstSession.maxWeight
    : 0;

  // Compute maximum sets across all sessions for graph legend
  const maxSetCount = historyData.reduce((max, s) => Math.max(max, s.sets.length), 0);

  // Chart bounds & geometry math
  const chartHeight = 220;
  const chartWidth = 320;
  const paddingX = 35;
  const paddingY = 25;

  const maxValRaw = useMemo(() => {
    if (historyData.length === 0) return 100;
    if (metricMode === 'volume') {
      return Math.max(...historyData.map(h => h.totalVolume)) * 1.15;
    }
    const maxSetW = Math.max(
      ...historyData.flatMap(h => h.sets.map(s => s.weightKg)),
      ...historyData.map(h => h.maxWeight)
    );
    return Math.max(maxSetW * 1.2, 50);
  }, [historyData, metricMode]);

  const maxVal = Math.ceil(maxValRaw / 10) * 10 || 100;

  // Compute max 4 evenly spaced tick label indices across the X-axis for scaling
  const labelIndices = useMemo(() => {
    const count = historyData.length;
    if (count <= 4) {
      return Array.from({ length: count }, (_, i) => i);
    }
    const step = (count - 1) / 3;
    return [0, Math.round(step), Math.round(step * 2), count - 1];
  }, [historyData.length]);

  const getX = (index: number) => {
    if (historyData.length <= 1) return chartWidth / 2;
    return paddingX + (index / (historyData.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    const usableH = chartHeight - paddingY * 2;
    return chartHeight - paddingY - (val / maxVal) * usableH;
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in text-[#F4F1EA]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#6B8E78] tracking-wider mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Progress & Analytics</span>
          </div>
          <h2 className="font-serif text-2xl font-medium text-[#F4F1EA]">Movement Progress</h2>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6B8E78]/15 border border-[#6B8E78]/30">
          <ChartIcon className="h-5 w-5 text-[#6B8E78]" />
        </div>
      </div>

      {/* Exercise Picker Dropdown */}
      <div className="glass-card-elevated p-4 rounded-3xl border border-[#F4F1EA]/15 shadow-xl space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#9E9B93]">
          Select Exercise to Track
        </label>
        
        <div className="relative">
          <select
            value={selectedExerciseId}
            onChange={(e) => {
              setSelectedExerciseId(e.target.value);
              setActivePoint(null);
            }}
            className="w-full appearance-none rounded-2xl bg-[#0F1317] border border-[#F4F1EA]/20 px-4 py-3.5 pr-10 text-sm font-medium text-[#F4F1EA] focus:outline-none focus:border-[#6B8E78] transition"
          >
            {allExercises.map(ex => (
              <option key={ex.id} value={ex.id} className="bg-[#171D22] text-[#F4F1EA]">
                {ex.name} ({ex.category})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-4 h-5 w-5 text-[#6B8E78] pointer-events-none" />
        </div>
      </div>

      {/* Metric Mode Selector Tabs */}
      <div className="flex rounded-2xl bg-[#171D22] p-1 border border-[#F4F1EA]/10">
        <button
          onClick={() => { setMetricMode('sets'); setActivePoint(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${
            metricMode === 'sets'
              ? 'bg-[#6B8E78] text-[#0F1317] shadow-md'
              : 'text-[#9E9B93] hover:text-[#F4F1EA]'
          }`}
        >
          Set Lines (kg)
        </button>
        <button
          onClick={() => { setMetricMode('max'); setActivePoint(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${
            metricMode === 'max'
              ? 'bg-[#6B8E78] text-[#0F1317] shadow-md'
              : 'text-[#9E9B93] hover:text-[#F4F1EA]'
          }`}
        >
          Max Weight
        </button>
        <button
          onClick={() => { setMetricMode('volume'); setActivePoint(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${
            metricMode === 'volume'
              ? 'bg-[#6B8E78] text-[#0F1317] shadow-md'
              : 'text-[#9E9B93] hover:text-[#F4F1EA]'
          }`}
        >
          Total Volume
        </button>
      </div>

      {/* Interactive Line Graph Card */}
      <div className="glass-card-elevated p-4 sm:p-5 rounded-3xl border border-[#F4F1EA]/15 shadow-xl relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-serif text-lg font-medium text-[#F4F1EA]">
              {selectedExercise?.name}
            </h3>
            <p className="text-xs text-[#9E9B93]">
              {historyData.length} Logged Sessions
            </p>
          </div>

          {/* Set Legend */}
          {metricMode === 'sets' && historyData.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap max-w-[150px] justify-end">
              {Array.from({ length: Math.min(maxSetCount, 5) }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: SET_COLORS[idx % SET_COLORS.length] }}
                  />
                  <span className="text-[10px] text-[#9E9B93]">S{idx + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Graph Display Area */}
        {historyData.length === 0 ? (
          <div className="my-10 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-[#0F1317]/50 border border-[#F4F1EA]/10">
            <Dumbbell className="h-10 w-10 text-[#9E9B93]/40 mb-3" />
            <p className="text-sm font-medium text-[#F4F1EA]">No Session Data Logged Yet</p>
            <p className="text-xs text-[#9E9B93] mt-1 max-w-xs leading-relaxed">
              Complete your first workout containing <span className="text-[#6B8E78]">{selectedExercise?.name}</span> to generate set progress curves!
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* SVG Chart Container */}
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Grid Horizontal Reference Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = paddingY + pct * (chartHeight - paddingY * 2);
                const val = Math.round(maxVal * (1 - pct));
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#F4F1EA"
                      strokeOpacity="0.08"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingX - 6}
                      y={y + 3}
                      fill="#9E9B93"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Set-by-Set Lines or Max/Volume Single Line */}
              {metricMode === 'sets' ? (
                // Draw a line for each set index (Set #1 line, Set #2 line, etc.)
                Array.from({ length: Math.min(maxSetCount, 5) }).map((_, setIdx) => {
                  const strokeColor = SET_COLORS[setIdx % SET_COLORS.length];

                  // Build SVG path points for this set across all sessions
                  const points = historyData
                    .map((session, sIdx) => {
                      const setObj = session.sets[setIdx];
                      if (!setObj) return null;
                      const x = getX(sIdx);
                      const y = getY(setObj.weightKg);
                      return `${x},${y}`;
                    })
                    .filter((p): p is string => p !== null);

                  if (points.length === 0) return null;

                  return (
                    <g key={setIdx}>
                      {/* Polyline Curve */}
                      <polyline
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points.join(' ')}
                        opacity="0.9"
                      />

                      {/* Interactive Point Dots */}
                      {historyData.map((session, sIdx) => {
                        const setObj = session.sets[setIdx];
                        if (!setObj) return null;
                        const cx = getX(sIdx);
                        const cy = getY(setObj.weightKg);
                        const isSelected = activePoint?.session.date === session.date && activePoint?.setIdx === setIdx;

                        return (
                          <circle
                            key={sIdx}
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 6 : 4}
                            fill={strokeColor}
                            stroke="#0F1317"
                            strokeWidth={isSelected ? 2 : 1}
                            className="cursor-pointer transition-all hover:scale-125"
                            onClick={() => setActivePoint({ session, setIdx })}
                          />
                        );
                      })}
                    </g>
                  );
                })
              ) : (
                // Single Line Mode (Max Weight or Volume)
                (() => {
                  const getMetricVal = (s: SessionPoint) => metricMode === 'max' ? s.maxWeight : s.totalVolume;
                  const points = historyData.map((session, sIdx) => `${getX(sIdx)},${getY(getMetricVal(session))}`);

                  return (
                    <g>
                      <polyline
                        fill="none"
                        stroke="#6B8E78"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points.join(' ')}
                      />
                      {historyData.map((session, sIdx) => {
                        const cx = getX(sIdx);
                        const cy = getY(getMetricVal(session));
                        const isSelected = activePoint?.session.date === session.date;
                        return (
                          <circle
                            key={sIdx}
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 6 : 4.5}
                            fill="#6B8E78"
                            stroke="#0F1317"
                            strokeWidth="2"
                            className="cursor-pointer transition-all hover:scale-125"
                            onClick={() => setActivePoint({ session })}
                          />
                        );
                      })}
                    </g>
                  );
                })()
              )}

              {/* Scaled X-Axis Date Labels (Max 4 Labels) */}
              {labelIndices.map((sIdx) => {
                const session = historyData[sIdx];
                if (!session) return null;
                const x = getX(sIdx);
                return (
                  <text
                    key={sIdx}
                    x={x}
                    y={chartHeight - 6}
                    fill="#9E9B93"
                    fontSize="9"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                  >
                    {session.formattedDate}
                  </text>
                );
              })}
            </svg>

            {/* Selected Data Point Detail Box */}
            {activePoint && (
              <div className="mt-4 p-3 rounded-2xl bg-[#0F1317] border border-[#6B8E78]/40 shadow-xl animate-fade-in flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#6B8E78]">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>{formatGraphDate(activePoint.session.date)} • {activePoint.session.workoutType}</span>
                  </div>
                  {activePoint.setIdx !== undefined && activePoint.session.sets[activePoint.setIdx] ? (
                    <p className="text-sm font-mono font-bold text-[#F4F1EA] mt-1">
                      Set #{activePoint.setIdx + 1}: {activePoint.session.sets[activePoint.setIdx].weightKg}kg × {activePoint.session.sets[activePoint.setIdx].reps} reps
                    </p>
                  ) : (
                    <p className="text-sm font-mono font-bold text-[#F4F1EA] mt-1">
                      Max: {activePoint.session.maxWeight}kg • Vol: {activePoint.session.totalVolume}kg
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setActivePoint(null)}
                  className="text-xs text-[#9E9B93] hover:text-[#F4F1EA] px-2 py-1 bg-[#171D22] rounded-lg"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary PR Stat Cards */}
      {historyData.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3.5 rounded-2xl border border-[#F4F1EA]/10 relative overflow-hidden">
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B8E78] font-medium uppercase tracking-wider mb-1">
              <Trophy className="h-3.5 w-3.5" />
              <span>All-Time PR</span>
            </div>
            <p className="font-serif text-xl font-bold text-[#F4F1EA]">{prWeight} <span className="text-xs font-sans font-normal text-[#9E9B93]">kg</span></p>
            <p className="text-[10px] text-[#9E9B93] mt-0.5">Peak Weight</p>
          </div>

          <div className="glass-card p-3.5 rounded-2xl border border-[#F4F1EA]/10">
            <p className="text-[11px] text-[#9E9B93] uppercase tracking-wider font-medium">Logged</p>
            <p className="font-serif text-xl font-medium text-[#F4F1EA] mt-1">{historyData.length} Times</p>
            <p className="text-[10px] text-[#9E9B93] mt-0.5">Total Sessions</p>
          </div>

          <div className="glass-card p-3.5 rounded-2xl border border-[#F4F1EA]/10">
            <p className="text-[11px] text-[#9E9B93] uppercase tracking-wider font-medium">Gain</p>
            <p className={`font-serif text-xl font-medium mt-1 ${weightGain >= 0 ? 'text-[#6B8E78]' : 'text-[#A85454]'}`}>
              {weightGain >= 0 ? `+${weightGain} kg` : `${weightGain} kg`}
            </p>
            <p className="text-[10px] text-[#9E9B93] mt-0.5">Progress</p>
          </div>
        </div>
      )}
    </div>
  );
};
