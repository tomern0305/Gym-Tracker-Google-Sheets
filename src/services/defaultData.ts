import type { Exercise, WorkoutTemplate, WorkoutSessionLog } from '../types';

export const INITIAL_EXERCISES: Exercise[] = [
  { id: 'ex-1', name: 'Barbell Bench Press', category: 'Chest', type: 'strength', defaultNotes: 'Seat height #2, grip medium' },
  { id: 'ex-2', name: 'Incline Dumbbell Press', category: 'Chest', type: 'strength', defaultNotes: '30 degree incline' },
  { id: 'ex-3', name: 'Cable Chest Flyes', category: 'Chest', type: 'strength', defaultNotes: 'Mid-pulley setting' },
  { id: 'ex-4', name: 'Lat Pulldown', category: 'Back', type: 'strength', defaultNotes: 'Wide grip bar' },
  { id: 'ex-5', name: 'Seated Cable Row', category: 'Back', type: 'strength', defaultNotes: 'V-bar attachment' },
  { id: 'ex-6', name: 'Barbell Squat', category: 'Legs', type: 'strength', defaultNotes: 'High bar position' },
  { id: 'ex-7', name: 'Romanian Deadlift', category: 'Legs', type: 'strength', defaultNotes: 'Slight knee bend, push hips back' },
  { id: 'ex-8', name: 'Leg Press', category: 'Legs', type: 'strength', defaultNotes: 'Feet shoulder-width high on sled' },
  { id: 'ex-9', name: 'Overhead Dumbbell Press', category: 'Shoulders', type: 'strength', defaultNotes: '90 degree bench' },
  { id: 'ex-10', name: 'Lateral Raises', category: 'Shoulders', type: 'strength', defaultNotes: 'Lead with elbows' },
  { id: 'ex-11', name: 'Bicep Barbell Curls', category: 'Arms', type: 'strength', defaultNotes: 'EZ-bar' },
  { id: 'ex-12', name: 'Tricep Rope Pushdown', category: 'Arms', type: 'strength', defaultNotes: 'Spread rope at bottom' },
  { id: 'ex-13', name: 'Hanging Leg Raises', category: 'Core', type: 'strength', defaultNotes: 'Control rotation' },
  { id: 'ex-14', name: 'Treadmill Interval', category: 'Cardio', type: 'cardio', defaultNotes: 'Incline 2.0' },
  { id: 'ex-15', name: 'Stationary Bike', category: 'Cardio', type: 'cardio', defaultNotes: 'Seat height 8' },
  { id: 'ex-16', name: 'Elliptical Trainer', category: 'Cardio', type: 'cardio', defaultNotes: 'Level 10 resistance' }
];

export const INITIAL_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Push Day',
    exerciseIds: ['ex-1', 'ex-2', 'ex-3', 'ex-9', 'ex-12']
  },
  {
    id: 'tmpl-2',
    name: 'Pull Day',
    exerciseIds: ['ex-4', 'ex-5', 'ex-11', 'ex-13']
  },
  {
    id: 'tmpl-3',
    name: 'Legs & Shoulders',
    exerciseIds: ['ex-6', 'ex-7', 'ex-8', 'ex-10']
  },
  {
    id: 'tmpl-4',
    name: 'Cardio & Core Focus',
    exerciseIds: ['ex-14', 'ex-15', 'ex-13']
  }
];

// Mock historical logs to immediately show beautiful calendar badges & previous exercise benchmarks on first launch!
export const INITIAL_LOGS: WorkoutSessionLog[] = [
  {
    id: 'log-demo-1',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // 2 days ago
    workoutType: 'Push Day',
    timestamp: Date.now() - 2 * 86400000,
    exercises: [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Barbell Bench Press',
        category: 'Chest',
        type: 'strength',
        sets: [
          { setNumber: 1, weightKg: 80, reps: 10, completed: true },
          { setNumber: 2, weightKg: 85, reps: 8, completed: true },
          { setNumber: 3, weightKg: 85, reps: 7, completed: true }
        ]
      },
      {
        exerciseId: 'ex-2',
        exerciseName: 'Incline Dumbbell Press',
        category: 'Chest',
        type: 'strength',
        sets: [
          { setNumber: 1, weightKg: 30, reps: 10, completed: true },
          { setNumber: 2, weightKg: 32, reps: 8, completed: true }
        ]
      }
    ]
  },
  {
    id: 'log-demo-2',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], // 4 days ago
    workoutType: 'Pull Day',
    timestamp: Date.now() - 4 * 86400000,
    exercises: [
      {
        exerciseId: 'ex-4',
        exerciseName: 'Lat Pulldown',
        category: 'Back',
        type: 'strength',
        sets: [
          { setNumber: 1, weightKg: 65, reps: 12, completed: true },
          { setNumber: 2, weightKg: 70, reps: 10, completed: true },
          { setNumber: 3, weightKg: 75, reps: 8, completed: true }
        ]
      }
    ]
  }
];
