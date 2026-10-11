export type Battery = 'full' | 'half' | 'low';

export type Task = { id: string; title: string; parentId?: string; createdAt: string; doneAt?: string };
export type Mood = 'calm' | 'okay' | 'anxious' | 'flat' | 'restless';
export type Day = { date: string; battery: Battery; mood?: Mood; at?: string };
export type Cycle = { id: string; date: string; startedAt: string; endedAt?: string; taskId?: string };
export type JournalEntry = { id: string; date: string; type: 'cycle' | 'note' | 'warmup'; text: string; cycleId?: string };
/** The cards you're touching before you focus. Belongs to the day it started. */
export type Warmup = { startedAt: string; touching: string[] };
export type Open = { at: string; actedAt?: string };
/** Something you do daily (exercise, breathwork). Not a task: it resets every day and is never dealt as a card. */
export type Routine = { id: string; title: string; createdAt: string; archivedAt?: string };
export type RoutineLog = { routineId: string; date: string; at: string };

export type State = {
  schemaVersion: 5;
  tasks: Task[];
  days: Day[];
  cycles: Cycle[];
  journal: JournalEntry[];
  opens: Open[];
  warmup?: Warmup;
  routines: Routine[];
  routineLog: RoutineLog[];
};

export const STORAGE_KEY = 'mms-state';
export const CURRENT_VERSION = 5;

/** The routines everyone starts with (fixed ids so a fresh state is always the same). */
export function defaultRoutines(): Routine[] {
  const createdAt = '2026-01-01T00:00:00.000Z';
  return [
    { id: 'r-exercise', title: 'Exercise', createdAt },
    { id: 'r-breathwork', title: 'Breathwork', createdAt: '2026-01-01T00:00:00.001Z' },
  ];
}

export function defaultState(): State {
  return { schemaVersion: 5, tasks: [], days: [], cycles: [], journal: [], opens: [], routines: defaultRoutines(), routineLog: [] };
}

/** A day runs 4 AM to 4 AM: a session that spills past midnight still belongs to the day it started. */
export const DAY_STARTS_AT_HOUR = 4;

/** Calendar date as YYYY-MM-DD in local time (not UTC). */
export function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The app's "today": local date, with anything before 4 AM counting as the previous day. */
export function todayStr(d: Date = new Date()): string {
  return localDateStr(new Date(d.getTime() - DAY_STARTS_AT_HOUR * 60 * 60 * 1000));
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

  const v = r.schemaVersion;
  if (v === 1 || v === 2 || v === 3 || v === 4 || v === 5) {
    const w = r.warmup as Warmup | undefined;
    const state: State = {
      schemaVersion: 5,
      tasks: arr<Task>(r.tasks),
      days: arr<Day>(r.days),
      cycles: arr<Cycle>(r.cycles),
      journal: arr<JournalEntry>(r.journal),
      opens: arr<Open>(r.opens),
      ...(w && typeof w.startedAt === 'string' && Array.isArray(w.touching) ? { warmup: w } : {}),
      routines: v === 5 ? arr<Routine>(r.routines) : defaultRoutines(),
      routineLog: arr<RoutineLog>(r.routineLog),
    };
    // v1 -> v2: days gained an optional mood. Nothing to convert.
    // v2 -> v3: days now start at 4 AM, so re-date what was recorded under midnight days.
    // v3 -> v4: optional warm-up cards and 'warmup' journal entries. Nothing to convert.
    // v4 -> v5: routines (starting with Exercise and Breathwork) and their daily log.
    return v === 1 || v === 2 ? redateToFourAm(state) : state;
  }

  // Unknown or missing version: start fresh rather than crash.
  return defaultState();
}

/**
 * Re-date v1/v2 data to the 4 AM day. Cycles carry a start time, so they move
 * exactly; their journal entries follow them. Old check-ins have no time, so
 * each is dated by the first app open on its calendar date (check-in happens on
 * opening). If two check-ins land on the same day, the later one wins.
 */
function redateToFourAm(state: State): State {
  const cycles = state.cycles.map((c) => ({ ...c, date: todayStr(new Date(c.startedAt)) }));
  const cycleDate = new Map(cycles.map((c) => [c.id, c.date]));
  const journal = state.journal.map((e) =>
    e.cycleId && cycleDate.has(e.cycleId) ? { ...e, date: cycleDate.get(e.cycleId)! } : e,
  );
  const redated = state.days.map((d) => {
    const firstOpen = state.opens.find((o) => localDateStr(new Date(o.at)) === d.date);
    return firstOpen ? { ...d, date: todayStr(new Date(firstOpen.at)) } : d;
  });
  const byDate = new Map<string, Day>();
  for (const d of redated) byDate.set(d.date, d);
  return { ...state, cycles, journal, days: [...byDate.values()] };
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
