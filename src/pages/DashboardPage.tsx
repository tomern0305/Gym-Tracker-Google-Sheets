import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Plus, 
  Sparkles, 
  Calendar as CalendarIcon, 
  ChevronRight as ArrowRight,
  Flame,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import type { WorkoutSessionLog, WorkoutTemplate } from '../types';
import { getWorkoutLogs, getTemplates, deleteWorkoutLog } from '../services/storage';

interface DashboardPageProps {
  onStartWorkout: (workoutType: string, template?: WorkoutTemplate) => void;
  onViewLog: (log: WorkoutSessionLog) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onStartWorkout, onViewLog }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayLog, setSelectedDayLog] = useState<WorkoutSessionLog | null>(null);
  const [showStartSheet, setShowStartSheet] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState('');

  const [logs, setLogs] = useState<WorkoutSessionLog[]>(getWorkoutLogs());
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(getTemplates());

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Hero "Start Workout" Banner */}
      <div className="glass-card-elevated p-5 rounded-3xl border border-[#F4F1EA]/15 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#6B8E78]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6B8E78] font-medium uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ready for Today's Session</span>
            </div>
            <h2 className="font-serif text-2xl font-medium text-[#F4F1EA]">What are we hitting today?</h2>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6B8E78]/20 border border-[#6B8E78]/40">
            <Flame className="h-6 w-6 text-[#6B8E78]" />
          </div>
        </div>

        <button
          onClick={() => setShowStartSheet(true)}
          className="mt-5 w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#6B8E78] py-4 text-base font-semibold text-[#0F1317] hover:bg-[#5C7C68] transition touch-shrink shadow-lg font-sans"
        >
          <Zap className="h-5 w-5 fill-[#0F1317]" />
          <span>Start a Workout</span>
        </button>
      </div>

      {/* Monthly Summary Strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-[#F4F1EA]/10">
          <p className="text-xs text-[#9E9B93] uppercase tracking-wider font-medium">Monthly Workouts</p>
          <p className="font-serif text-2xl font-medium text-[#F4F1EA] mt-1">{monthLogs.length} Sessions</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-[#F4F1EA]/10">
          <p className="text-xs text-[#9E9B93] uppercase tracking-wider font-medium">Last Workout</p>
          <p className="font-serif text-lg font-medium text-[#6B8E78] mt-1 truncate">
            {logs.length > 0 ? logs[0].workoutType : 'None yet'}
          </p>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="glass-card p-5 rounded-3xl border border-[#F4F1EA]/10">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-[#6B8E78]" />
            <h3 className="font-serif text-xl font-medium text-[#F4F1EA]">
              {monthNames[month]} <span className="text-[#9E9B93]">{year}</span>
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F272E] text-[#F4F1EA] hover:bg-[#6B8E78]/20 transition touch-shrink"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F272E] text-[#F4F1EA] hover:bg-[#6B8E78]/20 transition touch-shrink"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#9E9B93] mb-2 uppercase tracking-wider">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty prefix slots */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12 rounded-xl bg-transparent" />
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
                className={`relative flex flex-col items-center justify-between h-12 py-1.5 rounded-xl border text-xs transition touch-shrink ${
                  dayLog 
                    ? 'bg-[#6B8E78]/20 border-[#6B8E78]/50 text-[#F4F1EA] hover:border-[#6B8E78]' 
                    : isToday 
                    ? 'bg-[#1F272E] border-[#6B8E78] text-[#6B8E78] font-bold' 
                    : 'bg-[#171D22]/60 border-[#F4F1EA]/5 text-[#9E9B93]'
                }`}
              >
                <span className={`text-[11px] ${isToday ? 'font-bold text-[#6B8E78]' : ''}`}>{dayNum}</span>

                {/* Workout Badge Indicator */}
                {dayLog && (
                  <span className="w-full px-0.5 truncate text-[9px] font-semibold text-[#6B8E78] text-center leading-tight">
                    {dayLog.workoutType.split(' ')[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal: View Selected Day Log */}
      {selectedDayLog && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0" onClick={() => setSelectedDayLog(null)} />
          <div className="relative z-10 w-full max-w-md mx-auto max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[#F4F1EA]/15 bg-[#171D22] p-5 shadow-2xl animate-slide-up overflow-hidden">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#F4F1EA]/20" />
            <div className="flex items-center justify-between pb-3 border-b border-[#F4F1EA]/10">
              <div>
                <span className="text-xs font-semibold text-[#6B8E78] uppercase tracking-wider">{selectedDayLog.date}</span>
                <h3 className="font-serif text-2xl font-medium text-[#F4F1EA] mt-0.5">{selectedDayLog.workoutType}</h3>
              </div>
              <button
                onClick={() => handleDeleteLog(selectedDayLog.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A85454]/20 text-[#A85454] hover:bg-[#A85454] hover:text-[#0F1317] transition touch-shrink"
                title="Delete Session"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 max-h-60 overflow-y-auto space-y-3 pr-1">
              {selectedDayLog.exercises.map((ex, idx) => (
                <div key={idx} className="glass-card p-3 rounded-xl border border-[#F4F1EA]/10">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-medium text-sm text-[#F4F1EA]">{ex.exerciseName}</span>
                    <span className="text-[10px] uppercase font-semibold text-[#9E9B93] bg-[#1F272E] px-2 py-0.5 rounded-full">{ex.category}</span>
                  </div>
                  {ex.type === 'cardio' && ex.cardio ? (
                    <p className="text-xs text-[#6B8E78]">
                      🏃 {ex.cardio.durationMin} mins @ Level {ex.cardio.resistanceLevel}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {ex.sets.map((s, sIdx) => (
                        <span key={sIdx} className="text-xs bg-[#1F272E] border border-[#F4F1EA]/10 px-2 py-1 rounded-md text-[#9E9B93]">
                          <strong className="text-[#F4F1EA]">{s.weightKg}kg</strong> × {s.reps}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedDayLog(null)}
              className="mt-5 w-full rounded-xl bg-[#1F272E] py-3 text-sm font-medium text-[#F4F1EA] hover:bg-[#6B8E78]/20 transition touch-shrink"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet: Select Workout Type */}
      {showStartSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="absolute inset-0" onClick={() => setShowStartSheet(false)} />
          <div className="relative z-10 w-full max-w-md mx-auto max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[#F4F1EA]/15 bg-[#171D22] p-5 shadow-2xl animate-slide-up overflow-hidden">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#F4F1EA]/20" />
            <h3 className="font-serif text-2xl font-medium text-[#F4F1EA] text-center mb-1">Select Workout Type</h3>
            <p className="text-xs text-[#9E9B93] text-center mb-5">Pick a preset routine or enter a custom title</p>

            {/* Template options */}
            <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto mb-5 pr-1">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleStartTemplate(tmpl)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl glass-card border border-[#F4F1EA]/10 hover:border-[#6B8E78] transition touch-shrink text-left"
                >
                  <div>
                    <span className="font-serif text-lg font-medium text-[#F4F1EA] block">{tmpl.name}</span>
                    <span className="text-xs text-[#9E9B93]">{tmpl.exerciseIds.length} Exercises planned</span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6B8E78]/15 border border-[#6B8E78]/30">
                    <ArrowRight className="h-4 w-4 text-[#6B8E78]" />
                  </div>
                </button>
              ))}
            </div>

            {/* Custom workout input */}
            <form onSubmit={handleStartCustom} className="pt-3 border-t border-[#F4F1EA]/10">
              <label className="block text-xs font-medium text-[#9E9B93] mb-2 uppercase tracking-wider">
                Or Custom Workout Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customWorkoutName}
                  onChange={(e) => setCustomWorkoutName(e.target.value)}
                  placeholder="e.g. Arms & Core, Full Body..."
                  className="flex-1 rounded-xl bg-[#0F1317] border border-[#F4F1EA]/15 px-3.5 py-2.5 text-sm text-[#F4F1EA] placeholder-[#9E9B93]/40 focus:outline-none focus:border-[#6B8E78]"
                />
                <button
                  type="submit"
                  disabled={!customWorkoutName.trim()}
                  className="rounded-xl bg-[#6B8E78] px-4 py-2.5 font-medium text-[#0F1317] disabled:opacity-40 hover:bg-[#5C7C68] transition touch-shrink"
                >
                  Start
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
