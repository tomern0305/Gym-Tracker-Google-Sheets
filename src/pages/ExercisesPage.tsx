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
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#F4F1EA]">Movement Library</h2>
          <p className="text-xs text-[#9E9B93]">Control exercise catalog & machine settings</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 rounded-xl bg-[#6B8E78] px-3.5 py-2 text-xs font-semibold text-[#0F1317] hover:bg-[#5C7C68] transition touch-shrink shadow-md font-sans"
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
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition touch-shrink ${
              selectedCategory === cat 
                ? 'bg-[#6B8E78] text-[#0F1317] font-semibold' 
                : 'bg-[#171D22] border border-[#F4F1EA]/10 text-[#9E9B93] hover:text-[#F4F1EA]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise Items List */}
      <div className="space-y-2.5">
        {filteredExercises.map((ex) => (
          <div key={ex.id} className="glass-card p-4 rounded-2xl border border-[#F4F1EA]/10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-semibold text-[#6B8E78] bg-[#6B8E78]/15 px-2 py-0.5 rounded-full border border-[#6B8E78]/30">
                  {ex.category}
                </span>
                {ex.type === 'cardio' && (
                  <span className="text-[10px] uppercase font-semibold text-[#5B7B88] bg-[#5B7B88]/15 px-2 py-0.5 rounded-full">
                    Cardio
                  </span>
                )}
              </div>
              <h3 className="font-serif text-lg font-medium text-[#F4F1EA]">{ex.name}</h3>
              {ex.defaultNotes && (
                <p className="text-xs text-[#9E9B93] mt-0.5 italic">"{ex.defaultNotes}"</p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenEdit(ex)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F272E] text-[#9E9B93] hover:text-[#F4F1EA] transition touch-shrink"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(ex.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A85454]/15 text-[#A85454] hover:bg-[#A85454] hover:text-[#0F1317] transition touch-shrink"
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
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9E9B93] uppercase tracking-wider mb-1.5">
                Movement / Machine Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Incline Bench Press, Hack Squat..."
                required
                className="w-full rounded-xl bg-[#0F1317] border border-[#F4F1EA]/15 p-3 text-sm text-[#F4F1EA] placeholder-[#9E9B93]/40 focus:outline-none focus:border-[#6B8E78]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#9E9B93] uppercase tracking-wider mb-1.5">
                  Target Muscle
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MuscleCategory)}
                  className="w-full rounded-xl bg-[#0F1317] border border-[#F4F1EA]/15 p-3 text-sm text-[#F4F1EA] focus:outline-none focus:border-[#6B8E78]"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9E9B93] uppercase tracking-wider mb-1.5">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MovementType)}
                  className="w-full rounded-xl bg-[#0F1317] border border-[#F4F1EA]/15 p-3 text-sm text-[#F4F1EA] focus:outline-none focus:border-[#6B8E78]"
                >
                  <option value="strength">Strength (Sets/Reps)</option>
                  <option value="cardio">Cardio (Time/Resistance)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9E9B93] uppercase tracking-wider mb-1.5">
                Default Machine Setup Notes (Optional)
              </label>
              <input
                type="text"
                value={defaultNotes}
                onChange={(e) => setDefaultNotes(e.target.value)}
                placeholder="e.g. Seat pin #4, Grip width #2"
                className="w-full rounded-xl bg-[#0F1317] border border-[#F4F1EA]/15 p-3 text-sm text-[#F4F1EA] placeholder-[#9E9B93]/40 focus:outline-none focus:border-[#6B8E78]"
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3 rounded-xl bg-[#6B8E78] font-semibold text-[#0F1317] disabled:opacity-40 hover:bg-[#5C7C68] transition touch-shrink mt-4 font-sans"
            >
              Save Movement
            </button>
          </form>
        </ModalDrawer>
      )}
    </div>
  );
};
