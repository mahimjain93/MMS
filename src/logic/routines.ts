import { newId, todayStr, type Routine, type State } from '../storage';

/** Routines in use (not removed), in the order they were added. */
export function activeRoutines(state: State): Routine[] {
  return state.routines.filter((r) => !r.archivedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Ids of routines logged on a day. */
export function doneOn(state: State, date = todayStr()): Set<string> {
  return new Set(state.routineLog.filter((l) => l.date === date).map((l) => l.routineId));
}

/** Tap a routine: log it for today, or un-log it if it was already logged. */
export function toggleRoutine(state: State, id: string, now = new Date()): State {
  const date = todayStr(now);
  const logged = state.routineLog.some((l) => l.routineId === id && l.date === date);
  return {
    ...state,
    routineLog: logged
      ? state.routineLog.filter((l) => !(l.routineId === id && l.date === date))
      : [...state.routineLog, { routineId: id, date, at: now.toISOString() }],
  };
}

export function addRoutine(state: State, title: string, now = new Date()): State {
  const t = title.trim();
  if (!t) return state;
  return { ...state, routines: [...state.routines, { id: newId(), title: t, createdAt: now.toISOString() }] };
}

/** Remove a routine from the strip. Its history stays. */
export function removeRoutine(state: State, id: string, now = new Date()): State {
  return {
    ...state,
    routines: state.routines.map((r) => (r.id === id && !r.archivedAt ? { ...r, archivedAt: now.toISOString() } : r)),
  };
}

/** Titles of routines done on a day, in strip order (removed ones included). */
export function routinesDoneOn(state: State, date: string): string[] {
  const done = doneOn(state, date);
  return [...state.routines]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .filter((r) => done.has(r.id))
    .map((r) => r.title);
}
