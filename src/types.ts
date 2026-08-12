export type MuscleCategory = 
  | 'Chest' 
  | 'Back' 
  | 'Legs' 
  | 'Shoulders' 
  | 'Arms' 
  | 'Core' 
  | 'Cardio';

export type MovementType = 'strength' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  category: MuscleCategory;
  type: MovementType;
  defaultNotes?: string;
  equipment?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exerciseIds: string[];
}

export interface StrengthSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  notes?: string;
}

export interface CardioData {
  durationMin: number;
  resistanceLevel: number;
  calories?: number;
  distanceKm?: number;
}

export interface LoggedExercise {
  exerciseId: string;
  exerciseName: string;
  type: MovementType;
  category: MuscleCategory;
  sets: StrengthSet[];
  cardio?: CardioData;
  notes?: string;
}

export interface WorkoutSessionLog {
  id: string;
  date: string; // YYYY-MM-DD format
  workoutType: string; // e.g. "Push", "Pull", "Legs", "Full Body", "Cardio"
  exercises: LoggedExercise[];
  notes?: string;
  timestamp: number;
}

export interface PreviousBenchmark {
  date: string;
  workoutType: string;
  setsSummary: string; // e.g., "3 sets @ 80kg x 8 reps"
  cardioSummary?: string;
}

export interface AppSettings {
  googleWebAppUrl: string;
  passwordHash: string;
  weightUnit: 'kg' | 'lbs';
  lastSyncedAt?: number;
}

export interface RawSheetRow {
  id: string;
  date: string;
  workout_type: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  cardio_duration_min: number;
  cardio_resistance: number;
  notes: string;
  created_at: string;
}
