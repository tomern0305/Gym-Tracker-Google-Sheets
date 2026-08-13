import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Dumbbell, Filter } from 'lucide-react';
import type { Exercise, MuscleCategory, MovementType } from '../types';
import { getExercises, saveExercises } from '../services/storage';
import { ModalDrawer } from '../components/ModalDrawer';

export const ExercisesPage: React.FC = () => {
  const [exercises, setExercisesState] = useState<Exercise[]>(getExercises());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  React.useEffect(() => {
    const handleUpdate = () => {
      setExercisesState(getExercises());
    };
    window.addEventListener('aura_data_updated', handleUpdate);
    return () => window.removeEventListener('aura_data_updated', handleUpdate);
  }, []);

  const [editingEx, setEditingEx] = useState<Exercise | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MuscleCategory>('Chest');
  const [type, setType] = useState<MovementType>('strength');
  const [defaultNotes, setDefaultNotes] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);

  const categories: string[] = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'];

  const filteredExercises = selectedCategory === 'All'
    ? exercises
    : exercises.filter(e => e.category === selectedCategory);

  const handleOpenNew = () => {
    setEditingEx(null);
    setName('');
    setCategory('Chest');
    setType('strength');
    setDefaultNotes('');
    setShowDrawer(true);
  };

  const handleOpenEdit = (ex: Exercise) => {
    setEditingEx(ex);
    setName(ex.name);
    setCategory(ex.category);
    setType(ex.type);
    setDefaultNotes(ex.defaultNotes || '');
    setShowDrawer(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let updated: Exercise[];
    if (editingEx) {
      updated = exercises.map(ex =>
        ex.id === editingEx.id
          ? { ...ex, name: name.trim(), category, type, defaultNotes: defaultNotes.trim() }
          : ex
      );
    } else {
      const newEx: Exercise = {
        id: 'ex-' + Date.now(),
        name: name.trim(),
        category,
        type,
        defaultNotes: defaultNotes.trim()
      };
      updated = [...exercises, newEx];
    }

    setExercisesState(updated);
    saveExercises(updated);
    setShowDrawer(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this exercise from catalog?')) {
      const updated = exercises.filter(e => e.id !== id);
      setExercisesState(updated);
      saveExercises(updated);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">Movement Library</h2>
          <p className="text-xs text-ink-soft">Control exercise catalog & machine settings</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-on-accent hover:bg-accent-deep transition touch-shrink shadow-md font-sans"
        >
          <Plus className="h-4 w-4" />
          <span>New Movement</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition touch-shrink ${selectedCategory === cat
              ? 'bg-accent text-on-accent font-semibold'
              : 'bg-surface border border-line text-ink-soft hover:text-ink'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise Items List */}
      <div className="space-y-2.5">
        {filteredExercises.map((ex) => (
          <div key={ex.id} className="card p-4 rounded-2xl border border-line flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-semibold text-accent-deep bg-accent/10 px-2 py-0.5 rounded-full border border-accent/30">
                  {ex.category}
                </span>
                {ex.type === 'cardio' && (
                  <span className="text-[10px] uppercase font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                    Cardio
                  </span>
                )}
              </div>
              <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">{ex.name}</h3>
              {ex.defaultNotes && (
                <p className="text-xs text-ink-soft mt-0.5 italic">"{ex.defaultNotes}"</p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenEdit(ex)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-tint text-ink-soft hover:text-ink transition touch-shrink"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(ex.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/15 text-danger hover:bg-danger hover:text-on-accent transition touch-shrink"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer: Create / Edit Exercise */}
      {showDrawer && (
        <ModalDrawer
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          title={editingEx ? 'Edit Movement' : 'Add New Movement'}
          subtitle="Configure machine defaults and muscle targeting"
        >
          <form onSubmit={handleSave} className="flex flex-col justify-between min-h-full space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                  Movement / Machine Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Incline Bench Press, Hack Squat..."
                  required
                  className="w-full rounded-xl bg-raised border border-line p-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                    Target Muscle
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MuscleCategory)}
                    className="w-full rounded-xl bg-raised border border-line p-3 text-sm text-ink focus:outline-none focus:border-accent"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MovementType)}
                    className="w-full rounded-xl bg-raised border border-line p-3 text-sm text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="strength">Strength (Sets/Reps)</option>
                    <option value="cardio">Cardio (Time/Resistance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                  Default Machine Setup Notes (Optional)
                </label>
                <input
                  type="text"
                  value={defaultNotes}
                  onChange={(e) => setDefaultNotes(e.target.value)}
                  placeholder="e.g. Seat pin #4, Grip width #2"
                  className="w-full rounded-xl bg-raised border border-line p-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3.5 rounded-xl bg-accent font-semibold text-sm text-on-accent disabled:opacity-40 hover:bg-accent-deep transition touch-shrink shrink-0 font-sans shadow-md mt-4"
            >
              Save Movement
            </button>
          </form>
        </ModalDrawer>
      )}
    </div>
  );
};
