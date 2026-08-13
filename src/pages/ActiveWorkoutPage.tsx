import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Check,
  ChevronRight,
  History,
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  LoggedExercise,
  WorkoutSessionLog,
  Exercise,
  WorkoutTemplate,
  StrengthSet,
  CardioData
} from '../types';
import {
  getExercises,
  getPreviousBenchmark,
  getLastSessionExerciseData,
  saveWorkoutLog,
  todayKey
} from '../services/storage';
import { ModalDrawer } from '../components/ModalDrawer';

interface ActiveWorkoutPageProps {
  workoutType: string;
  initialTemplate?: WorkoutTemplate;
  onFinish: () => void;
  onCancel: () => void;
}

export const ActiveWorkoutPage: React.FC<ActiveWorkoutPageProps> = ({
  workoutType,
  initialTemplate,
  onFinish,
  onCancel,
}) => {
  const allExercises = getExercises();
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [selectedExIndex, setSelectedExIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Cardio Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    // Populate initial exercise list from template or defaults
    if (initialTemplate && initialTemplate.exerciseIds.length > 0) {
      const mapped = initialTemplate.exerciseIds
        .map(id => allExercises.find(e => e.id === id))
        .filter((e): e is Exercise => e !== undefined)
        .map(e => createEmptyLoggedExercise(e));
      setExercises(mapped);
    } else {
      // Default to 3 exercises matching category or general
      const defaults = allExercises.slice(0, 3).map(e => createEmptyLoggedExercise(e));
      setExercises(defaults);
    }
  }, [initialTemplate]);

  // Timer ticker
  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  function createEmptyLoggedExercise(ex: Exercise): LoggedExercise {
    const lastSession = getLastSessionExerciseData(ex.name);

    if (ex.type === 'cardio') {
      const durationMin = lastSession?.cardio?.durationMin ?? 15;
      const resistanceLevel = lastSession?.cardio?.resistanceLevel ?? 5;
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        type: 'cardio',
        category: ex.category,
        sets: [],
        cardio: { durationMin, resistanceLevel },
        notes: ex.defaultNotes
      };
    }

    let initialSets: StrengthSet[] = [];
    if (lastSession?.sets && lastSession.sets.length > 0) {
      initialSets = lastSession.sets.map((s, idx) => ({
        setNumber: idx + 1,
        weightKg: s.weightKg,
        reps: s.reps,
        completed: false,
        notes: s.notes
      }));
    } else {
      initialSets = [
        { setNumber: 1, weightKg: 30, reps: 10, completed: false },
        { setNumber: 2, weightKg: 30, reps: 10, completed: false },
        { setNumber: 3, weightKg: 30, reps: 10, completed: false }
      ];
    }

    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      type: 'strength',
      category: ex.category,
      sets: initialSets,
      notes: ex.defaultNotes
    };
  }

  // --- Ad-Hoc Exercise Management ---
  const handleAddAdHocExercise = (ex: Exercise) => {
    setExercises(prev => [...prev, createEmptyLoggedExercise(ex)]);
    setShowAddModal(false);
  };

  const handleRemoveAdHocExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
    if (selectedExIndex === index) setSelectedExIndex(null);
  };

  // --- Set Logging Operations ---
  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    setExercises(prev => {
      const copy = [...prev];
      const ex = { ...copy[exIdx] };
      const sets = [...ex.sets];
      sets[setIdx] = { ...sets[setIdx], completed: !sets[setIdx].completed };
      ex.sets = sets;
      copy[exIdx] = ex;
      return copy;
    });
  };

  const handleUpdateSet = (exIdx: number, setIdx: number, field: 'weightKg' | 'reps', val: number) => {
    setExercises(prev => {
      const copy = [...prev];
      const ex = { ...copy[exIdx] };
      const sets = [...ex.sets];
      sets[setIdx] = { ...sets[setIdx], [field]: Math.max(0, val) };
      ex.sets = sets;
      copy[exIdx] = ex;
      return copy;
    });
  };

  const handleAddSet = (exIdx: number) => {
    setExercises(prev => {
      const copy = [...prev];
      const ex = { ...copy[exIdx] };
      const lastSet = ex.sets[ex.sets.length - 1];
      const newSet: StrengthSet = {
        setNumber: ex.sets.length + 1,
        weightKg: lastSet ? lastSet.weightKg : 40,
        reps: lastSet ? lastSet.reps : 10,
        completed: false
      };
      ex.sets = [...ex.sets, newSet];
      copy[exIdx] = ex;
      return copy;
    });
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setExercises(prev => {
      const copy = [...prev];
      const ex = { ...copy[exIdx] };
      ex.sets = ex.sets.filter((_, i) => i !== setIdx).map((s, i) => ({ ...s, setNumber: i + 1 }));
      copy[exIdx] = ex;
      return copy;
    });
  };

  // --- Cardio Operations ---
  const handleUpdateCardio = (exIdx: number, field: keyof CardioData, val: number) => {
    setExercises(prev => {
      const copy = [...prev];
      const ex = { ...copy[exIdx] };
      ex.cardio = { ...ex.cardio, [field]: Math.max(0, val) } as CardioData;
      copy[exIdx] = ex;
      return copy;
    });
  };

  // --- Complete Session ---
  const handleFinishSession = () => {
    if (exercises.length === 0) {
      alert('Please add at least one exercise to save workout.');
      return;
    }

    const newLog: WorkoutSessionLog = {
      id: 'log-' + Date.now(),
      date: todayKey(),
      workoutType: workoutType,
      exercises: exercises,
      timestamp: Date.now()
    };

    saveWorkoutLog(newLog);

    // Fire Confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6B8E78', '#5B7B88', '#F4F1EA']
      });
    } catch (e) { }

    onFinish();
  };

  const activeExercise = selectedExIndex !== null ? exercises[selectedExIndex] : null;
  const benchmark = activeExercise ? getPreviousBenchmark(activeExercise.exerciseName) : null;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-[#F4F1EA]/10">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-[#9E9B93] hover:text-[#F4F1EA] transition touch-shrink"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit</span>
        </button>
        <div className="text-center">
          <span className="text-[10px] uppercase font-semibold text-[#6B8E78] tracking-widest block">Active Session</span>
          <h2 className="font-serif text-xl font-medium text-[#F4F1EA]">{workoutType}</h2>
        </div>
        <button
          onClick={handleFinishSession}
          className="flex items-center gap-1 rounded-xl bg-[#6B8E78] px-3.5 py-1.5 text-xs font-semibold text-[#0F1317] hover:bg-[#5C7C68] transition touch-shrink shadow-md font-sans"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Finish</span>
        </button>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs uppercase font-semibold text-[#9E9B93] tracking-wider">
            Planned Movements ({exercises.length})
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-xs text-[#6B8E78] hover:text-[#F4F1EA] transition font-medium touch-shrink"
          >
            <Plus className="h-4 w-4" />
            <span>Add Exercise</span>
          </button>
        </div>

        {exercises.map((ex, exIdx) => {
          const completedCount = ex.type === 'strength'
            ? ex.sets.filter(s => s.completed).length
            : (ex.cardio ? 1 : 0);
          const totalCount = ex.type === 'strength' ? ex.sets.length : 1;
          const exBenchmark = getPreviousBenchmark(ex.exerciseName);

          return (
            <div
              key={exIdx}
              className="glass-card p-4 rounded-2xl border border-[#F4F1EA]/10 hover:border-[#6B8E78]/50 transition touch-shrink relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setSelectedExIndex(exIdx)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold text-[#6B8E78] bg-[#6B8E78]/15 px-2 py-0.5 rounded-full border border-[#6B8E78]/30">
                      {ex.category}
                    </span>
                    {ex.type === 'cardio' && (
                      <span className="text-[10px] uppercase font-semibold text-[#5B7B88] bg-[#5B7B88]/15 px-2 py-0.5 rounded-full">
                        Cardio
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-medium text-[#F4F1EA] mt-1">{ex.exerciseName}</h3>

                  {/* Previous Benchmark Reference */}
                  {exBenchmark && (
                    <div className="flex items-center gap-1 text-[11px] text-[#9E9B93] mt-1">
                      <History className="h-3 w-3 text-[#6B8E78]" />
                      <span>Prev: {exBenchmark.setsSummary || exBenchmark.cardioSummary}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-medium text-[#F4F1EA] block">
                      {completedCount}/{totalCount}
                    </span>
                    <span className="text-[10px] text-[#9E9B93] block">Sets</span>
                  </div>

                  {/* Open Detail button */}
                  <button
                    onClick={() => setSelectedExIndex(exIdx)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F272E] text-[#6B8E78] border border-[#F4F1EA]/10 touch-shrink"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Remove Ad-Hoc exercise */}
                  <button
                    onClick={() => handleRemoveAdHocExercise(exIdx)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A85454]/15 text-[#A85454] hover:bg-[#A85454] hover:text-[#0F1317] transition touch-shrink"
                    title="Remove from today's workout"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer: Detailed Exercise Logger */}
      {selectedExIndex !== null && activeExercise && (
        <ModalDrawer
          isOpen={selectedExIndex !== null}
          onClose={() => setSelectedExIndex(null)}
          title={activeExercise.exerciseName}
          subtitle={`${activeExercise.category} • ${activeExercise.type.toUpperCase()}`}
        >
          {/* Historical Reference Alert Box */}
          {/* {benchmark && (
            <div className="mb-4 glass-card p-3 rounded-xl border border-[#6B8E78]/30 bg-[#6B8E78]/10 flex items-start gap-2.5">
              <History className="h-4 w-4 text-[#6B8E78] mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-[#6B8E78] block">Last Session Benchmark ({benchmark.date})</span>
                <span className="text-xs text-[#F4F1EA] font-mono">{benchmark.setsSummary || benchmark.cardioSummary}</span>
              </div>
            </div>
          )} */}

          {/* Strength Set Logging */}
          {activeExercise.type === 'strength' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold uppercase text-[#9E9B93] px-2 text-center">
                <span className="col-span-2">Set</span>
                <span className="col-span-4">Weight (kg)</span>
                <span className="col-span-4">Reps</span>
                <span className="col-span-2">Done</span>
              </div>

              {activeExercise.sets.map((set, sIdx) => (
                <div
                  key={sIdx}
                  className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border transition ${set.completed
                      ? 'bg-[#6B8E78]/15 border-[#6B8E78]/40'
                      : 'bg-[#0F1317] border-[#F4F1EA]/10'
                    }`}
                >
                  <span className="col-span-2 text-center text-xs font-bold text-[#F4F1EA]">#{set.setNumber}</span>

                  {/* Weight Input */}
                  <div className="col-span-4 flex items-center bg-[#171D22] border border-[#F4F1EA]/15 rounded-lg px-1.5 py-1">
                    <button
                      onClick={() => handleUpdateSet(selectedExIndex, sIdx, 'weightKg', set.weightKg - 2.5)}
                      className="text-xs text-[#9E9B93] px-1 hover:text-[#F4F1EA]"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={set.weightKg}
                      onChange={(e) => handleUpdateSet(selectedExIndex, sIdx, 'weightKg', parseFloat(e.target.value) || 0)}
                      className="w-full text-center text-sm font-mono font-bold text-[#F4F1EA] bg-transparent focus:outline-none"
                    />
                    <button
                      onClick={() => handleUpdateSet(selectedExIndex, sIdx, 'weightKg', set.weightKg + 2.5)}
                      className="text-xs text-[#9E9B93] px-1 hover:text-[#F4F1EA]"
                    >
                      +
                    </button>
                  </div>

                  {/* Reps Input */}
                  <div className="col-span-4 flex items-center bg-[#171D22] border border-[#F4F1EA]/15 rounded-lg px-1.5 py-1">
                    <button
                      onClick={() => handleUpdateSet(selectedExIndex, sIdx, 'reps', set.reps - 1)}
                      className="text-xs text-[#9E9B93] px-1 hover:text-[#F4F1EA]"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => handleUpdateSet(selectedExIndex, sIdx, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full text-center text-sm font-mono font-bold text-[#F4F1EA] bg-transparent focus:outline-none"
                    />
                    <button
                      onClick={() => handleUpdateSet(selectedExIndex, sIdx, 'reps', set.reps + 1)}
                      className="text-xs text-[#9E9B93] px-1 hover:text-[#F4F1EA]"
                    >
                      +
                    </button>
                  </div>

                  {/* Checkmark Completion */}
                  <div className="col-span-2 flex items-center justify-center">
                    <button
                      onClick={() => handleToggleSetComplete(selectedExIndex, sIdx)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center border transition touch-shrink ${set.completed
                          ? 'bg-[#6B8E78] border-[#6B8E78] text-[#0F1317]'
                          : 'bg-[#171D22] border-[#F4F1EA]/20 text-[#9E9B93]'
                        }`}
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => handleAddSet(selectedExIndex)}
                className="w-full py-2.5 rounded-xl border border-dashed border-[#F4F1EA]/20 text-xs font-medium text-[#6B8E78] hover:border-[#6B8E78] transition touch-shrink mt-2"
              >
                + Add Set
              </button>
            </div>
          ) : (
            /* Cardio Logging */
            <div className="space-y-4">
              {/* Cardio Live Timer Pill */}
              <div className="glass-card p-4 rounded-2xl border border-[#5B7B88]/40 bg-[#5B7B88]/10 text-center">
                <span className="text-xs text-[#5B7B88] font-semibold uppercase tracking-wider block">Live Cardio Timer</span>
                <span className="font-mono text-3xl font-bold text-[#F4F1EA] block my-1">{formatTimer(timerSeconds)}</span>

                <div className="flex justify-center gap-2 mt-2">
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#5B7B88] text-[#0F1317] font-semibold text-xs touch-shrink"
                  >
                    {timerActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{timerActive ? 'Pause' : 'Start Timer'}</span>
                  </button>
                  <button
                    onClick={() => { setTimerActive(false); setTimerSeconds(0); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1F272E] text-[#9E9B93] text-xs touch-shrink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Cardio Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#9E9B93] uppercase font-semibold mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={activeExercise.cardio?.durationMin || 0}
                    onChange={(e) => handleUpdateCardio(selectedExIndex, 'durationMin', parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl bg-[#0F1317] border border-[#F4F1EA]/15 p-3 text-lg font-mono font-bold text-[#F4F1EA]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#9E9B93] uppercase font-semibold mb-1">
                    Resistance / Incline Level
                  </label>
                  <input
                    type="number"
                    value={activeExercise.cardio?.resistanceLevel || 0}
                    onChange={(e) => handleUpdateCardio(selectedExIndex, 'resistanceLevel', parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl bg-[#0F1317] border border-[#F4F1EA]/15 p-3 text-lg font-mono font-bold text-[#F4F1EA]"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setSelectedExIndex(null)}
            className="mt-6 w-full rounded-xl bg-[#6B8E78] py-3 text-sm font-semibold text-[#0F1317] hover:bg-[#5C7C68] transition touch-shrink"
          >
            Save Exercise Details
          </button>
        </ModalDrawer>
      )}

      {/* Modal: Select Ad-Hoc Exercise to Add */}
      {showAddModal && (
        <ModalDrawer
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Movement to Today's Session"
          subtitle="Will not change your master routine template"
        >
          <div className="space-y-2 pr-1">
            {allExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleAddAdHocExercise(ex)}
                className="w-full flex items-center justify-between p-3 rounded-xl glass-card border border-[#F4F1EA]/10 hover:border-[#6B8E78] transition touch-shrink text-left"
              >
                <div>
                  <span className="font-medium text-sm text-[#F4F1EA] block">{ex.name}</span>
                  <span className="text-[10px] text-[#9E9B93] uppercase font-semibold">{ex.category} • {ex.type}</span>
                </div>
                <Plus className="h-4 w-4 text-[#6B8E78]" />
              </button>
            ))}
          </div>
        </ModalDrawer>
      )}
    </div>
  );
};
