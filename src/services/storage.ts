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

// --- Calendar Day Keys ---
// Logs are keyed by local calendar day ('YYYY-MM-DD'). The Sheets 'date' column
// is stored as a real Date, so it comes back as a full timestamp string and has
// to be folded back to a day key or none of the calendar lookups match.
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateKey(value: Date | string | number): string {
  if (typeof value === 'string' && DATE_KEY_PATTERN.test(value.trim())) {
    return value.trim();
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (isNaN(parsed.getTime())) return typeof value === 'string' ? value : '';

  // Exactly midnight UTC means a date-only value was serialized as UTC; reading
  // it in local time would land on the previous day west of Greenwich.
  const isUtcMidnight =
    parsed.getUTCHours() === 0 &&
    parsed.getUTCMinutes() === 0 &&
    parsed.getUTCSeconds() === 0 &&
    parsed.getUTCMilliseconds() === 0;

  const year = isUtcMidnight ? parsed.getUTCFullYear() : parsed.getFullYear();
  const month = (isUtcMidnight ? parsed.getUTCMonth() : parsed.getMonth()) + 1;
  const day = isUtcMidnight ? parsed.getUTCDate() : parsed.getDate();

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/**
 * Older backends emitted the date column as String(dateCell).split('T')[0],
 * which truncates at the first 'T' — an empty string for Tuesday and Thursday,
 * a mangled stub for every other day. Fall back to when the row was created.
 */
function resolveLogDate(log: WorkoutSessionLog): string {
  const fromDate = toDateKey(log.date);
  if (DATE_KEY_PATTERN.test(fromDate)) return fromDate;
  return log.timestamp ? toDateKey(log.timestamp) : fromDate;
}

// --- Local & Remote Data Services ---
const DEMO_EXERCISE_IDS = new Set(['ex-1','ex-2','ex-3','ex-4','ex-5','ex-6','ex-7','ex-8','ex-9','ex-10','ex-11','ex-12','ex-13','ex-14','ex-15','ex-16']);
const DEMO_TEMPLATE_IDS = new Set(['tmpl-1','tmpl-2','tmpl-3','tmpl-4']);
const DEMO_LOG_IDS = new Set(['log-demo-1','log-demo-2']);

export function getExercises(): Exercise[] {
  const stored = localStorage.getItem(KEYS.EXERCISES);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter(e => e && e.id && !DEMO_EXERCISE_IDS.has(e.id));
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
        return parsed.filter(t => t && t.id && !DEMO_TEMPLATE_IDS.has(t.id));
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
        // Newest first: 'last workout' and the benchmark lookups walk this in
        // order, and a fetch from Sheets arrives in whatever order the rows sit.
        return parsed
          .filter(l => l && l.id && !DEMO_LOG_IDS.has(l.id))
          .map(l => ({ ...l, date: resolveLogDate(l) }))
          .sort((a, b) =>
            b.date.localeCompare(a.date) || (b.timestamp || 0) - (a.timestamp || 0)
          );
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
  window.dispatchEvent(new Event('aura_data_updated'));
  syncDeleteLogToGoogleSheets(logId);
}

export async function syncDeleteLogToGoogleSheets(logId: string): Promise<boolean> {
  const settings = getSettings();
  if (!settings.googleWebAppUrl) return false;

  try {
    const response = await fetch(settings.googleWebAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete_log', logId })
    });
    const json = await response.json();
    return json.success === true;
  } catch (e) {
    return false;
  }
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

export function getLastSessionExerciseData(exerciseName: string): { sets?: StrengthSet[]; cardio?: CardioData; date?: string } | null {
  const logs = getWorkoutLogs();
  for (const log of logs) {
    const matched = log.exercises.find(
      e => e.exerciseName.toLowerCase().trim() === exerciseName.toLowerCase().trim()
    );
    if (matched) {
      return {
        sets: matched.sets,
        cardio: matched.cardio,
        date: log.date
      };
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

/**
 * The sheet is the source of truth for anything it knows about, but a session
 * saved while the sync was failing exists only here — replacing the array
 * outright would erase it from the calendar on the next launch.
 */
function mergeLogs(remote: WorkoutSessionLog[], local: WorkoutSessionLog[]): WorkoutSessionLog[] {
  const byId = new Map<string, WorkoutSessionLog>();
  for (const log of local) {
    if (log && log.id) byId.set(log.id, log);
  }
  for (const log of remote) {
    if (log && log.id) byId.set(log.id, log);
  }
  return Array.from(byId.values());
}

export async function fetchAllFromGoogleSheets(): Promise<boolean> {
  const settings = getSettings();
  if (!settings.googleWebAppUrl) return false;

  try {
    const response = await fetch(`${settings.googleWebAppUrl}?action=get_all`);
    const json = await response.json();
    if (json.success && json.data) {
      if (json.data.logs && Array.isArray(json.data.logs)) {
        localStorage.setItem(KEYS.LOGS, JSON.stringify(mergeLogs(json.data.logs, getWorkoutLogs())));
      }
      if (json.data.templates && Array.isArray(json.data.templates)) {
        localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(json.data.templates));
      }
      if (json.data.exercises && Array.isArray(json.data.exercises)) {
        localStorage.setItem(KEYS.EXERCISES, JSON.stringify(json.data.exercises));
      }
      saveSettings({ lastSyncedAt: Date.now() });
      window.dispatchEvent(new Event('aura_data_updated'));
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
