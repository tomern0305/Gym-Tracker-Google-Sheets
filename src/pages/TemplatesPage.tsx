import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Layers, Check, X, Dumbbell } from 'lucide-react';
import type { WorkoutTemplate, Exercise } from '../types';
import { getTemplates, saveTemplates, getExercises } from '../services/storage';
import { ModalDrawer } from '../components/ModalDrawer';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplatesState] = useState<WorkoutTemplate[]>(getTemplates());
  const exercises = getExercises();

  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [selectedExIds, setSelectedExIds] = useState<string[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  const handleOpenNew = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setSelectedExIds([]);
    setShowDrawer(true);
  };

  const handleOpenEdit = (tmpl: WorkoutTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateName(tmpl.name);
    setSelectedExIds([...tmpl.exerciseIds]);
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
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#F4F1EA]">Workout Routines</h2>
          <p className="text-xs text-[#9E9B93]">Manage master day templates & default exercises</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 rounded-xl bg-[#6B8E78] px-3.5 py-2 text-xs font-semibold text-[#0F1317] hover:bg-[#5C7C68] transition touch-shrink shadow-md font-sans"
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
            <div key={tmpl.id} className="glass-card p-4 rounded-2xl border border-[#F4F1EA]/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6B8E78]/15 border border-[#6B8E78]/30">
                    <Layers className="h-4 w-4 text-[#6B8E78]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#F4F1EA]">{tmpl.name}</h3>
                    <p className="text-xs text-[#9E9B93]">{assignedExercises.length} Movements assigned</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(tmpl)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F272E] text-[#9E9B93] hover:text-[#F4F1EA] transition touch-shrink"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A85454]/15 text-[#A85454] hover:bg-[#A85454] hover:text-[#0F1317] transition touch-shrink"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Assigned Exercise Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#F4F1EA]/5">
                {assignedExercises.map((ex) => (
                  <span key={ex.id} className="text-[11px] bg-[#171D22] border border-[#F4F1EA]/10 px-2.5 py-1 rounded-lg text-[#F4F1EA]">
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
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9E9B93] uppercase tracking-wider mb-1.5">
                Routine Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Upper Body Focus, Leg Day B..."
                required
                className="w-full rounded-xl bg-[#0F1317] border border-[#F4F1EA]/15 p-3 text-sm text-[#F4F1EA] placeholder-[#9E9B93]/40 focus:outline-none focus:border-[#6B8E78]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9E9B93] uppercase tracking-wider mb-2">
                Select Movements ({selectedExIds.length})
              </label>
              <div className="space-y-2 pr-1">
                {exercises.map((ex) => {
                  const isSelected = selectedExIds.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => handleToggleExerciseSelection(ex.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition touch-shrink ${
                        isSelected 
                          ? 'bg-[#6B8E78]/15 border-[#6B8E78]/50 text-[#F4F1EA]' 
                          : 'bg-[#0F1317] border-[#F4F1EA]/10 text-[#9E9B93]'
                      }`}
                    >
                      <div>
                        <span className="font-medium text-sm block">{ex.name}</span>
                        <span className="text-[10px] uppercase font-semibold text-[#9E9B93]">{ex.category} • {ex.type}</span>
                      </div>
                      <div className={`h-6 w-6 rounded-md flex items-center justify-center border ${
                        isSelected ? 'bg-[#6B8E78] border-[#6B8E78] text-[#0F1317]' : 'border-[#F4F1EA]/20'
                      }`}>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!templateName.trim()}
              className="w-full py-3 rounded-xl bg-[#6B8E78] font-semibold text-[#0F1317] disabled:opacity-40 hover:bg-[#5C7C68] transition touch-shrink mt-4 font-sans"
            >
              Save Template
            </button>
          </form>
        </ModalDrawer>
      )}
    </div>
  );
};
