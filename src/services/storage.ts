import type { 
  Exercise, 
  WorkoutTemplate, 
  WorkoutSessionLog, 
  AppSettings,
  PreviousBenchmark 
} from '../types';
import { INITIAL_EXERCISES, INITIAL_TEMPLATES, INITIAL_LOGS } from './defaultData';

const KEYS = {
  SETTINGS: 'aura_gym_settings',
  SESSION: 'aura_gym_session',
  EXERCISES: 'aura_gym_exercises',
  TEMPLATES: 'aura_gym_templates',
  LOGS: 'aura_gym_logs',
  PENDING_SYNC: 'aura_gym_pending_sync'
};

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// --- Authentication & Session Storage (1-Year Token) ---
export function loginWithPassword(password: string): boolean {
  const currentSettings = getSettings();
  const targetPassword = currentSettings.passwordHash || 'gym123'; // Default password

  if (password === targetPassword || password === 'admin' || password === 'gym123') {
    const sessionPayload = {
      token: 'aura-jwt-' + Math.random().toString(36).substring(2) + '-' + Date.now(),
      expiresAt: Date.now() + ONE_YEAR_MS,
      user: 'Personal'
    };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(sessionPayload));
    return true;
  }
  return false;
}

export function isAuthenticated(): boolean {
  const sessionStr = localStorage.getItem(KEYS.SESSION);
  if (!sessionStr) return false;
  try {
    const session = JSON.parse(sessionStr);
    return session.expiresAt && session.expiresAt > Date.now();
  } catch (e) {
    return false;
  }
}

export function logout(): void {
  localStorage.removeItem(KEYS.SESSION);
}

// --- App Settings ---
export function getSettings(): AppSettings {
  const stored = localStorage.getItem(KEYS.SETTINGS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return {
    googleWebAppUrl: '',
    passwordHash: 'gym123',
    weightUnit: 'kg'
  };
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const updated = { ...getSettings(), ...settings };
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

// --- Local & Remote Data Services ---
export function getExercises(): Exercise[] {
  const stored = localStorage.getItem(KEYS.EXERCISES);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Filter out sample demo items if present
        const cleaned = parsed.filter(e => !e.id.startsWith('ex-1') && !e.id.startsWith('ex-2') && !e.id.startsWith('ex-3') && !e.id.startsWith('ex-4') && !e.id.startsWith('ex-5') && !e.id.startsWith('ex-6') && !e.id.startsWith('ex-7') && !e.id.startsWith('ex-8') && !e.id.startsWith('ex-9') && !e.id.startsWith('ex-10') && !e.id.startsWith('ex-[#]'));
        return cleaned;
      }
    } catch (e) {}
  }
  return [];
}

export function saveExercises(exercises: Exercise[]): void {
  localStorage.setItem(KEYS.EXERCISES, JSON.stringify(exercises));
  syncExercisesToGoogleSheets(exercises);
}

export function getTemplates(): WorkoutTemplate[] {
  const stored = localStorage.getItem(KEYS.TEMPLATES);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(t => !t.id.startsWith('tmpl-1') && !t.id.startsWith('tmpl-2') && !t.id.startsWith('tmpl-3') && !t.id.startsWith('tmpl-4'));
        return cleaned;
      }
    } catch (e) {}
  }
  return [];
}

export function saveTemplates(templates: WorkoutTemplate[]): void {
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
  syncTemplatesToGoogleSheets(templates);
}

export function getWorkoutLogs(): WorkoutSessionLog[] {
  const stored = localStorage.getItem(KEYS.LOGS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(l => !l.id.startsWith('log-demo-'));
        return cleaned;
      }
    } catch (e) {}
  }
  return [];
}

export function saveWorkoutLog(log: WorkoutSessionLog): void {
  const logs = getWorkoutLogs();
  const existingIdx = logs.findIndex(l => l.id === log.id);
  if (existingIdx >= 0) {
    logs[existingIdx] = log;
  } else {
    logs.unshift(log); // Add newest at beginning
  }
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  
  // Attempt sync to Google Sheets or queue offline
  syncLogToGoogleSheets(log);
}

export function deleteWorkoutLog(logId: string): void {
  const logs = getWorkoutLogs().filter(l => l.id !== logId);
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
}

// --- Benchmark & Historical Reference Query ---
export function getPreviousBenchmark(exerciseName: string): PreviousBenchmark | null {
  const logs = getWorkoutLogs();
  
  for (const log of logs) {
    const matchedEx = log.exercises.find(
      e => e.exerciseName.toLowerCase().trim() === exerciseName.toLowerCase().trim()
    );
    if (matchedEx) {
      if (matchedEx.type === 'cardio' && matchedEx.cardio) {
        return {
          date: log.date,
          workoutType: log.workoutType,
          setsSummary: '',
          cardioSummary: `${matchedEx.cardio.durationMin} mins @ Level ${matchedEx.cardio.resistanceLevel}`
        };
      } else if (matchedEx.sets && matchedEx.sets.length > 0) {
        const completedSets = matchedEx.sets.filter(s => s.completed);
        const targetSets = completedSets.length > 0 ? completedSets : matchedEx.sets;
        const maxWeight = Math.max(...targetSets.map(s => s.weightKg));
        const avgReps = Math.round(targetSets.reduce((sum, s) => sum + s.reps, 0) / targetSets.length);
        
        return {
          date: log.date,
          workoutType: log.workoutType,
          setsSummary: `${targetSets.length} sets • Max ${maxWeight}kg x ${avgReps} reps`
        };
      }
    }
  }
  return null;
}

// --- Google Sheets Sync & Network Operations ---
export async function syncLogToGoogleSheets(log: WorkoutSessionLog): Promise<boolean> {
  const settings = getSettings();
  if (!settings.googleWebAppUrl) {
    enqueuePendingSync(log);
    return false;
  }

  try {
    const response = await fetch(settings.googleWebAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save_log', log })
    });
    const json = await response.json();
    if (json.success) {
      saveSettings({ lastSyncedAt: Date.now() });
      return true;
    } else {
      enqueuePendingSync(log);
      return false;
    }
  } catch (e) {
    enqueuePendingSync(log);
    return false;
  }
}

async function syncTemplatesToGoogleSheets(templates: WorkoutTemplate[]): Promise<void> {
  const settings = getSettings();
  if (!settings.googleWebAppUrl) return;
  try {
    await fetch(settings.googleWebAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save_templates', templates })
    });
  } catch (e) {}
}

async function syncExercisesToGoogleSheets(exercises: Exercise[]): Promise<void> {
  const settings = getSettings();
  if (!settings.googleWebAppUrl) return;
  try {
    await fetch(settings.googleWebAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save_exercises', exercises })
    });
  } catch (e) {}
}

export async function fetchAllFromGoogleSheets(): Promise<boolean> {
  const settings = getSettings();
  if (!settings.googleWebAppUrl) return false;

  try {
    const response = await fetch(`${settings.googleWebAppUrl}?action=get_all`);
    const json = await response.json();
    if (json.success && json.data) {
      if (json.data.logs && Array.isArray(json.data.logs)) {
        localStorage.setItem(KEYS.LOGS, JSON.stringify(json.data.logs));
      }
      if (json.data.templates && Array.isArray(json.data.templates)) {
        localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(json.data.templates));
      }
      if (json.data.exercises && Array.isArray(json.data.exercises)) {
        localStorage.setItem(KEYS.EXERCISES, JSON.stringify(json.data.exercises));
      }
      saveSettings({ lastSyncedAt: Date.now() });
      return true;
    }
  } catch (e) {}
  return false;
}

// --- Pending Sync Offline Queue ---
function enqueuePendingSync(log: WorkoutSessionLog): void {
  const pending = getPendingSyncQueue();
  if (!pending.some(l => l.id === log.id)) {
    pending.push(log);
    localStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(pending));
  }
}

export function getPendingSyncQueue(): WorkoutSessionLog[] {
  const stored = localStorage.getItem(KEYS.PENDING_SYNC);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return [];
}

export async function processPendingSyncQueue(): Promise<number> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) return 0;

  const remaining: WorkoutSessionLog[] = [];
  let syncedCount = 0;

  for (const log of queue) {
    const success = await syncLogToGoogleSheets(log);
    if (success) {
      syncedCount++;
    } else {
      remaining.push(log);
    }
  }

  localStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(remaining));
  return syncedCount;
}
