export type Battery = 'full' | 'half' | 'low';

export type Task = { id: string; title: string; parentId?: string; createdAt: string; doneAt?: string };
export type Mood = 'calm' | 'okay' | 'anxious' | 'flat' | 'restless';
export type Day = { date: string; battery: Battery; mood?: Mood };
export type Cycle = { id: string; date: string; startedAt: string; endedAt?: string; taskId?: string };
export type JournalEntry = { id: string; date: string; type: 'cycle' | 'note'; text: string; cycleId?: string };
export type Open = { at: string; actedAt?: string };

export type State = {
  schemaVersion: 2;
  tasks: Task[];
  days: Day[];
  cycles: Cycle[];
  journal: JournalEntry[];
  opens: Open[];
};

export const STORAGE_KEY = 'mms-state';
export const CURRENT_VERSION = 2;

export function defaultState(): State {
  return { schemaVersion: 2, tasks: [], days: [], cycles: [], journal: [], opens: [] };
}

/** Local date as YYYY-MM-DD (not UTC, so late-night IST stays on the right day). */
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/**
 * Turns whatever is in storage into a valid current State.
 * Anything unreadable becomes a fresh default. Each future schema change
 * adds one step here (v1 -> v2, v2 -> v3 ...); never clear storage instead.
 */
export function migrate(raw: unknown): State {
  if (!raw || typeof raw !== 'object') return defaultState();
  const r = raw as Record<string, unknown>;

  // v1 -> v2: days gained an optional mood. Nothing to convert.
  if (r.schemaVersion === 1 || r.schemaVersion === 2) {
    return {
      schemaVersion: 2,
      tasks: arr<Task>(r.tasks),
      days: arr<Day>(r.days),
      cycles: arr<Cycle>(r.cycles),
      journal: arr<JournalEntry>(r.journal),
      opens: arr<Open>(r.opens),
    };
  }

  // Unknown or missing version: start fresh rather than crash.
  return defaultState();
}

export function parse(text: string | null): State {
  if (!text) return defaultState();
  try {
    return migrate(JSON.parse(text));
  } catch {
    return defaultState();
  }
}

export function load(): State {
  try {
    return parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return defaultState();
  }
}

export function save(state: State): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked — the app keeps working in memory.
  }
}

/* ---- Device preferences (kept apart from State: they belong to this browser, not your data) ---- */

export type ThemePref = 'light' | 'dark' | 'auto';
export const THEME_KEY = 'mms-theme';

export function loadTheme(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'dark' || v === 'auto' || v === 'light' ? v : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(pref: ThemePref): void {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // ignore
  }
}
