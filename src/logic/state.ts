import { newId, todayStr, type Battery, type State } from '../storage';

/** Record that the app was opened. Called once per load. */
export function recordOpen(state: State, now = new Date()): State {
  return { ...state, opens: [...state.opens, { at: now.toISOString() }] };
}

/** Mark the latest open as "acted on" — only the first action counts. */
export function markActed(state: State, now = new Date()): State {
  const last = state.opens[state.opens.length - 1];
  if (!last || last.actedAt) return state;
  const opens = [...state.opens.slice(0, -1), { ...last, actedAt: now.toISOString() }];
  return { ...state, opens };
}

export function batteryFor(state: State, date = todayStr()): Battery | undefined {
  return state.days.find((d) => d.date === date)?.battery;
}

export function checkIn(state: State, battery: Battery, date = todayStr()): State {
  const days = state.days.filter((d) => d.date !== date);
  return { ...state, days: [...days, { date, battery }] };
}

export function addTask(state: State, title: string, now = new Date()): State {
  const t = title.trim();
  if (!t) return state;
  return { ...state, tasks: [...state.tasks, { id: newId(), title: t, createdAt: now.toISOString() }] };
}
