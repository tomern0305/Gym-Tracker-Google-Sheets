import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Layers, Check, X, Dumbbell } from 'lucide-react';
import type { WorkoutTemplate, Exercise } from '../types';
import { getTemplates, saveTemplates, getExercises } from '../services/storage';
import { ModalDrawer } from '../components/ModalDrawer';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplatesState] = useState<WorkoutTemplate[]>(getTemplates());
  const [exercises, setExercisesState] = useState<Exercise[]>(getExercises());

  React.useEffect(() => {
    const handleUpdate = () => {
      setTemplatesState(getTemplates());
      setExercisesState(getExercises());
    };
    window.addEventListener('aura_data_updated', handleUpdate);
    return () => window.removeEventListener('aura_data_updated', handleUpdate);
  }, []);

  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [selectedExIds, setSelectedExIds] = useState<string[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  // Empty means every class is shown, so the filter starts open rather than blank.
  const [visibleCategories, setVisibleCategories] = useState<string[]>([]);

  const categories = React.useMemo(
    () => Array.from(new Set(exercises.map(ex => ex.category || 'General'))).sort(
      (a, b) => a.localeCompare(b)
    ),
    [exercises]
  );

  const groupedExercises = React.useMemo(() => {
    const shown = visibleCategories.length === 0
      ? categories
      : categories.filter(c => visibleCategories.includes(c));

    return shown
      .map(category => ({
        category,
        items: exercises
          .filter(ex => (ex.category || 'General') === category)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter(group => group.items.length > 0);
  }, [exercises, categories, visibleCategories]);

  const selectedCountIn = (category: string) =>
    exercises.filter(
      ex => (ex.category || 'General') === category && selectedExIds.includes(ex.id)
    ).length;

  const toggleCategory = (category: string) =>
    setVisibleCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );

  const handleOpenNew = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setSelectedExIds([]);
    setVisibleCategories([]);
    setShowDrawer(true);
  };

  const handleOpenEdit = (tmpl: WorkoutTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateName(tmpl.name);
    setSelectedExIds([...tmpl.exerciseIds]);
    setVisibleCategories([]);
    setShowDrawer(true);
  };

  const handleToggleExerciseSelection = (exId: string) => {
    setSelectedExIds(prev => 
      prev.includes(exId) ? prev.filter(id => id !== exId) : [...prev, exId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    let updated: WorkoutTemplate[];
    if (editingTemplate) {
      updated = templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, name: templateName.trim(), exerciseIds: selectedExIds } 
          : t
      );
    } else {
      const newTmpl: WorkoutTemplate = {
        id: 'tmpl-' + Date.now(),
        name: templateName.trim(),
        exerciseIds: selectedExIds
      };
      updated = [...templates, newTmpl];
    }

    setTemplatesState(updated);
    saveTemplates(updated);
    setShowDrawer(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this workout routine template?')) {
      const updated = templates.filter(t => t.id !== id);
      setTemplatesState(updated);
      saveTemplates(updated);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">Workout Routines</h2>
          <p className="text-xs text-ink-soft">Manage master day templates & default exercises</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-on-accent hover:bg-accent-deep transition touch-shrink shadow-md font-sans"
        >
          <Plus className="h-4 w-4" />
          <span>New Routine</span>
        </button>
      </div>

      {/* Templates Cards Grid */}
      <div className="space-y-3">
        {templates.map((tmpl) => {
          const assignedExercises = tmpl.exerciseIds
            .map(id => exercises.find(e => e.id === id))
            .filter((e): e is Exercise => e !== undefined);

          return (
            <div key={tmpl.id} className="card p-4 rounded-2xl border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 border border-accent/30">
                    <Layers className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">{tmpl.name}</h3>
                    <p className="text-xs text-ink-soft">{assignedExercises.length} Movements assigned</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(tmpl)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-tint text-ink-soft hover:text-ink transition touch-shrink"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/15 text-danger hover:bg-danger hover:text-on-accent transition touch-shrink"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Assigned Exercise Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-line">
                {assignedExercises.map((ex) => (
                  <span key={ex.id} className="text-[11px] bg-surface border border-line px-2.5 py-1 rounded-lg text-ink">
                    {ex.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer: Create / Edit Template */}
      {showDrawer && (
        <ModalDrawer
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          title={editingTemplate ? 'Edit Routine Template' : 'Create New Routine'}
          subtitle="Select movements to include by default"
        >
          <form onSubmit={handleSave} className="flex flex-col justify-between min-h-full space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1.5">
                  Routine Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Upper Body Focus, Leg Day B..."
                  required
                  className="w-full rounded-xl bg-raised border border-line p-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">
                  Select Movements ({selectedExIds.length})
                </label>

                {exercises.length === 0 ? (
                  <p className="text-xs text-ink-soft italic p-4 rounded-xl bg-raised border border-line text-center leading-relaxed">
                    No movements in library yet. Add movements from the Library tab first!
                  </p>
                ) : (
                  <>
                    {/* Class filter — one scrolling row so it never eats the sheet */}
                    <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto scrollbar-none px-1 pb-1">
                      <button
                        type="button"
                        onClick={() => setVisibleCategories([])}
                        aria-pressed={visibleCategories.length === 0}
                        className={`flex h-11 shrink-0 items-center rounded-full border px-4 text-xs font-semibold transition touch-shrink ${
                          visibleCategories.length === 0
                            ? 'border-accent bg-accent text-on-accent'
                            : 'border-line bg-raised text-ink-soft'
                        }`}
                      >
                        All
                      </button>
                      {categories.map((category) => {
                        const isOn = visibleCategories.includes(category);
                        const chosen = selectedCountIn(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => toggleCategory(category)}
                            aria-pressed={isOn}
                            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold uppercase tracking-wide transition touch-shrink ${
                              isOn
                                ? 'border-accent bg-accent text-on-accent'
                                : 'border-line bg-raised text-ink-soft'
                            }`}
                          >
                            <span>{category}</span>
                            {chosen > 0 && (
                              <span
                                className={`tabular text-[10px] font-bold ${
                                  isOn ? 'text-on-accent/80' : 'text-accent-deep'
                                }`}
                              >
                                {chosen}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Grouped by class, alphabetical within each group */}
                    <div className="space-y-4">
                      {groupedExercises.map(({ category, items }) => (
                        <div key={category}>
                          <div className="mb-2 flex items-baseline justify-between">
                            <p className="eyebrow">{category}</p>
                            <p className="text-[10px] font-medium text-ink-faint tabular">
                              {selectedCountIn(category)}/{items.length}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {items.map((ex) => {
                              const isSelected = selectedExIds.includes(ex.id);
                              return (
                                <div
                                  key={ex.id}
                                  onClick={() => handleToggleExerciseSelection(ex.id)}
                                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition touch-shrink ${
                                    isSelected
                                      ? 'bg-accent/10 border-accent text-ink'
                                      : 'bg-raised border-line text-ink-soft'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <span className="block truncate text-sm font-medium">{ex.name}</span>
                                    <span className="text-[10px] uppercase font-semibold text-ink-faint">{ex.type}</span>
                                  </div>
                                  <div className={`ml-3 h-6 w-6 shrink-0 rounded-md flex items-center justify-center border ${
                                    isSelected ? 'bg-accent border-accent text-on-accent' : 'border-line'
                                  }`}>
                                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!templateName.trim()}
              className="w-full py-3.5 rounded-xl bg-accent font-semibold text-sm text-on-accent disabled:opacity-40 hover:bg-accent-deep transition touch-shrink shrink-0 font-sans shadow-md mt-4"
            >
              Save Template
            </button>
          </form>
        </ModalDrawer>
      )}
    </div>
  );
};
