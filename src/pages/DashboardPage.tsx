import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  ChevronRight as ArrowRight,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import type { WorkoutSessionLog, WorkoutTemplate } from '../types';
import { getWorkoutLogs, getTemplates, deleteWorkoutLog, todayKey } from '../services/storage';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface DashboardPageProps {
  onStartWorkout: (workoutType: string, template?: WorkoutTemplate) => void;
  onViewLog: (log: WorkoutSessionLog) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

// Day keys are local calendar days; new Date('YYYY-MM-DD') would read them as
// UTC midnight and name the wrong day west of Greenwich.
function parseDayKey(key: string): Date | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!parts) return null;
  return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
}

function formatDayLabel(key: string): string {
  const date = parseDayKey(key);
  if (!date) return key;
  return `${WEEKDAY_NAMES[date.getDay()].slice(0, 3)} ${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)}`;
}

function formatLongDayLabel(key: string): string {
  const date = parseDayKey(key);
  if (!date) return key;
  return `${WEEKDAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onStartWorkout, onViewLog }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayLog, setSelectedDayLog] = useState<WorkoutSessionLog | null>(null);
  const [showStartSheet, setShowStartSheet] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState('');

  const [logs, setLogs] = useState<WorkoutSessionLog[]>(getWorkoutLogs());
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(getTemplates());

  useBodyScrollLock(Boolean(selectedDayLog) || showStartSheet);

  React.useEffect(() => {
    const handleUpdate = () => {
      setLogs(getWorkoutLogs());
      setTemplates(getTemplates());
    };
    window.addEventListener('aura_data_updated', handleUpdate);
    return () => window.removeEventListener('aura_data_updated', handleUpdate);
  }, []);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map logs by YYYY-MM-DD
  const logsByDate = logs.reduce((acc, log) => {
    acc[log.date] = log;
    return acc;
  }, {} as Record<string, WorkoutSessionLog>);

  // Compute month stats
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthLogs = logs.filter(l => l.date.startsWith(currentMonthPrefix));

  const handleStartTemplate = (template: WorkoutTemplate) => {
    setShowStartSheet(false);
    onStartWorkout(template.name, template);
  };

  const handleStartCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWorkoutName.trim()) return;
    const name = customWorkoutName.trim();
    setCustomWorkoutName('');
    setShowStartSheet(false);
    onStartWorkout(name);
  };

  const handleDeleteLog = (logId: string) => {
    if (confirm('Delete this logged workout record?')) {
      deleteWorkoutLog(logId);
      setSelectedDayLog(null);
    }
  };

  const todayStr = todayKey();
  const todayLabel = formatLongDayLabel(todayStr);
  const todayLog = logsByDate[todayStr];
  const hasLoggedToday = Boolean(todayLog);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero — dateline, editorial headline, one action */}
      <div className="card-raised rounded-3xl p-6">
        <p className="eyebrow">{todayLabel}</p>

        <h2 className="mt-3 font-display text-[2rem] font-bold leading-[1.08] tracking-[-0.03em] text-ink">
          {hasLoggedToday ? todayLog.workoutType : 'What are we hitting today?'}
        </h2>

        {hasLoggedToday ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Logged for today. One session a day.</span>
          </p>
        ) : (
          <button
            onClick={() => setShowStartSheet(true)}
            className="mt-6 w-full rounded-2xl bg-accent py-4 text-base font-semibold text-on-accent transition hover:bg-accent-deep touch-shrink font-sans"
          >
            Start a Workout
          </button>
        )}
      </div>

      {/* Monthly Summary Strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card rounded-2xl p-4">
          <p className="eyebrow">This Month</p>
          <p className="mt-2 font-display text-[2.75rem] font-bold leading-none tracking-[-0.04em] text-ink tabular">
            {monthLogs.length}
          </p>
          <p className="mt-1.5 text-xs text-ink-soft">
            {monthLogs.length === 1 ? 'session' : 'sessions'}
          </p>
        </div>
        <div className="card rounded-2xl p-4">
          <p className="eyebrow">Last Worked</p>
          <p className="mt-2 truncate font-display text-[1.35rem] font-semibold leading-tight tracking-[-0.02em] text-accent">
            {logs.length > 0 ? logs[0].workoutType : 'Nothing yet'}
          </p>
          {logs.length > 0 && (
            <p className="mt-1.5 text-xs text-ink-soft">{formatDayLabel(logs[0].date)}</p>
          )}
        </div>
      </div>

      {/* Calendar Section */}
      <div className="card rounded-3xl p-5">
        {/* Calendar Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-[1.5rem] font-semibold leading-none tracking-[-0.02em] text-ink">
            {MONTH_NAMES[month]} <span className="text-ink-faint">{year}</span>
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft transition hover:bg-tint hover:text-ink touch-shrink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft transition hover:bg-tint hover:text-ink touch-shrink"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty prefix slots */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14" />
          ))}

          {/* Days in month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const dayLog = logsByDate[dateStr];

            return (
              <button
                key={`day-${dayNum}`}
                onClick={() => dayLog && setSelectedDayLog(dayLog)}
                disabled={!dayLog}
                aria-label={
                  dayLog
                    ? `${formatDayLabel(dateStr)} — ${dayLog.workoutType}`
                    : formatDayLabel(dateStr)
                }
                className={`relative flex h-14 min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl px-0.5 text-xs transition touch-shrink ${
                  dayLog
                    ? 'bg-accent text-on-accent'
                    : isToday
                    ? 'text-accent ring-1 ring-inset ring-accent'
                    : 'text-ink-faint'
                }`}
              >
                <span className={`tabular text-[13px] leading-none ${isToday || dayLog ? 'font-semibold' : ''}`}>
                  {dayNum}
                </span>

                {/* Workout name, clipped to the cell. min-w-0 on the button lets
                    the grid column shrink; without it a long name widens it. */}
                {dayLog && (
                  <span className="w-full truncate text-center text-[8.5px] font-medium leading-tight tracking-tight text-on-accent">
                    {dayLog.workoutType}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal: View Selected Day Log */}
      {selectedDayLog && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-ink/50 pt-[var(--header-total)] backdrop-blur-sm sm:justify-center sm:px-4 sm:pb-4 sm:pt-[calc(var(--header-total)+1rem)] animate-fade-in">
          <div className="absolute inset-0" onClick={() => setSelectedDayLog(null)} />
          <div className="relative z-10 mx-auto flex max-h-full min-h-0 w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-line bg-raised p-5 pb-[calc(1.25rem+var(--safe-bottom))] shadow-lg sm:rounded-3xl sm:pb-5 animate-slide-up">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line-strong shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-line shrink-0">
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">{selectedDayLog.date}</span>
                <h3 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink mt-0.5">{selectedDayLog.workoutType}</h3>
              </div>
              <button
                onClick={() => handleDeleteLog(selectedDayLog.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/20 text-danger hover:bg-danger hover:text-on-accent transition touch-shrink"
                title="Delete Session"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pr-1">
              {selectedDayLog.exercises.map((ex, idx) => (
                <div key={idx} className="card p-3 rounded-xl border border-line">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-medium text-sm text-ink">{ex.exerciseName}</span>
                    <span className="text-[10px] uppercase font-semibold text-ink-soft bg-tint px-2 py-0.5 rounded-full">{ex.category}</span>
                  </div>
                  {ex.type === 'cardio' && ex.cardio ? (
                    <p className="text-xs text-accent">
                      🏃 {ex.cardio.durationMin} mins @ Level {ex.cardio.resistanceLevel}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {ex.sets.map((s, sIdx) => (
                        <span key={sIdx} className="text-xs bg-tint border border-line px-2 py-1 rounded-md text-ink-soft">
                          <strong className="text-ink">{s.weightKg}kg</strong> × {s.reps}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedDayLog(null)}
              className="mt-5 w-full shrink-0 rounded-xl bg-tint py-3 text-sm font-medium text-ink hover:bg-accent/20 transition touch-shrink"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Bottom Sheet: Select Workout Type */}
      {showStartSheet && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-ink/50 pt-[var(--header-total)] backdrop-blur-sm sm:justify-center sm:px-4 sm:pb-4 sm:pt-[calc(var(--header-total)+1rem)] animate-fade-in">
          <div className="absolute inset-0" onClick={() => setShowStartSheet(false)} />
          <div className="relative z-10 mx-auto flex max-h-full min-h-0 w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-line bg-raised p-5 pb-[calc(1.25rem+var(--safe-bottom))] shadow-lg sm:rounded-3xl sm:pb-5 animate-slide-up">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line-strong shrink-0" />
            <h3 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink text-center mb-1 shrink-0">Select Workout Type</h3>
            <p className="text-xs text-ink-soft text-center mb-5 shrink-0">Pick a preset routine or enter a custom title</p>

            {/* Template options */}
            <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto overscroll-contain mb-5 pr-1">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleStartTemplate(tmpl)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl card border border-line hover:border-accent transition touch-shrink text-left"
                >
                  <div>
                    <span className="font-display text-lg font-semibold tracking-[-0.01em] text-ink block">{tmpl.name}</span>
                    <span className="text-xs text-ink-soft">{tmpl.exerciseIds.length} Exercises planned</span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 border border-accent/30">
                    <ArrowRight className="h-4 w-4 text-accent" />
                  </div>
                </button>
              ))}
            </div>

            {/* Custom workout input */}
            <form onSubmit={handleStartCustom} className="pt-3 border-t border-line shrink-0">
              <label className="block text-xs font-medium text-ink-soft mb-2 uppercase tracking-wider">
                Or Custom Workout Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customWorkoutName}
                  onChange={(e) => setCustomWorkoutName(e.target.value)}
                  placeholder="e.g. Arms & Core, Full Body..."
                  className="flex-1 rounded-xl bg-raised border border-line px-3.5 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!customWorkoutName.trim()}
                  className="rounded-xl bg-accent px-4 py-2.5 font-medium text-on-accent disabled:opacity-40 hover:bg-accent-deep transition touch-shrink"
                >
                  Start
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
