import { newId, todayStr, type Cycle, type State, type Task } from '../storage';
import { markActed } from './state';

export const CYCLE_MINUTES = 25;
export const CYCLE_MS = CYCLE_MINUTES * 60 * 1000;

/** The cycle that's running, if any (started, not yet ended). */
export function activeCycle(state: State): Cycle | undefined {
  const last = state.cycles[state.cycles.length - 1];
  return last && !last.endedAt ? last : undefined;
}

export function remainingMs(cycle: Cycle, now = new Date()): number {
  return Math.max(0, new Date(cycle.startedAt).getTime() + CYCLE_MS - now.getTime());
}

/** Start a cycle on a task, or with no task (JUST START). Counts as acting. */
export function startCycle(state: State, taskId?: string, now = new Date()): State {
  if (activeCycle(state)) return state;
  const cycle: Cycle = { id: newId(), date: todayStr(now), startedAt: now.toISOString(), taskId };
  return markActed({ ...state, cycles: [...state.cycles, cycle] }, now);
}

/** Mark a task done. When the last open step of a split task is done, the task it came from is done too. */
export function completeTask(tasks: Task[], taskId: string, now = new Date()): Task[] {
  const at = now.toISOString();
  let out = tasks.map((t) => (t.id === taskId && !t.doneAt ? { ...t, doneAt: at } : t));
  let parentId = out.find((t) => t.id === taskId)?.parentId;
  while (parentId) {
    const pid = parentId;
    const openSteps = out.some((t) => t.parentId === pid && !t.doneAt);
    if (openSteps) break;
    out = out.map((t) => (t.id === pid && !t.doneAt ? { ...t, doneAt: at } : t));
    parentId = out.find((t) => t.id === pid)?.parentId;
  }
  return out;
}

/** End the running cycle with the answers from "How was that?". */
export function finishCycle(state: State, answer: { done: boolean; note: string }, now = new Date()): State {
  const cycle = activeCycle(state);
  if (!cycle) return state;
  const ended: Cycle = { ...cycle, endedAt: now.toISOString() };
  const tasks = answer.done && cycle.taskId ? completeTask(state.tasks, cycle.taskId, now) : state.tasks;
  return {
    ...state,
    tasks,
    cycles: [...state.cycles.slice(0, -1), ended],
    journal: [
      ...state.journal,
      { id: newId(), date: cycle.date, type: 'cycle', text: answer.note.trim(), cycleId: cycle.id },
    ],
  };
}

/**
 * Replace a task with 2–3 smaller steps. Steps take the task's place in the
 * queue (same age, in the order typed), so the first step shows up next.
 */
export function splitTask(state: State, taskId: string, steps: string[]): State {
  const parent = state.tasks.find((t) => t.id === taskId);
  const titles = steps.map((s) => s.trim()).filter(Boolean);
  if (!parent || titles.length === 0) return state;
  const base = new Date(parent.createdAt).getTime();
  const children: Task[] = titles.map((title, i) => ({
    id: newId(),
    title,
    parentId: parent.id,
    createdAt: new Date(base + i + 1).toISOString(),
  }));
  return { ...state, tasks: [...state.tasks, ...children] };
}

export function addNote(state: State, text: string, now = new Date()): State {
  const t = text.trim();
  if (!t) return state;
  return { ...state, journal: [...state.journal, { id: newId(), date: todayStr(now), type: 'note', text: t }] };
}
