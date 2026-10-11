import { newId, todayStr, type Battery, type State, type Task } from '../storage';
import { activeCycle, completeTask, startCycle } from './cycles';
import { candidates } from './pickDoorway';
import { markActed } from './state';

export const MAX_CARDS = 3;

const byOldest = (a: Task, b: Task) => a.createdAt.localeCompare(b.createdAt);

/** Open tasks in dealing order: oldest first; on Low battery, split-off steps come first. */
export function dealOrder(tasks: Task[], battery: Battery): Task[] {
  const pool = candidates(tasks).sort(byOldest);
  if (battery !== 'low') return pool;
  return [...pool.filter((t) => t.parentId), ...pool.filter((t) => !t.parentId)];
}

/** Tasks you're touching today that are still open (a new day starts a fresh warm-up). */
export function touchingNow(state: State, today = todayStr()): string[] {
  const w = state.warmup;
  if (!w || todayStr(new Date(w.startedAt)) !== today) return [];
  const open = new Set(candidates(state.tasks).map((t) => t.id));
  return w.touching.filter((id) => open.has(id));
}

/**
 * The cards on screen: what you're touching, then fill up to 3 in dealing
 * order. Swapped-out tasks go to the back rather than disappearing, so they
 * come back when there's a free slot.
 */
export function dealCards(tasks: Task[], battery: Battery, touching: string[], skipIds: string[]): Task[] {
  const order = dealOrder(tasks, battery);
  const held = touching.map((id) => order.find((t) => t.id === id)).filter((t): t is Task => !!t);
  const rest = order.filter((t) => !touching.includes(t.id));
  const skip = new Set(skipIds);
  const fill = [...rest.filter((t) => !skip.has(t.id)), ...rest.filter((t) => skip.has(t.id))];
  return [...held, ...fill.slice(0, Math.max(0, MAX_CARDS - held.length))];
}

/** Can a card be swapped for one not already on screen? */
export function canSwap(tasks: Task[], cardCount: number): boolean {
  return candidates(tasks).length > cardCount;
}

/**
 * Swap a card out. Its slot is refilled with the next task in order; once
 * every task has been seen, the round starts again (without bringing back the
 * card just swapped out).
 */
export function swapCard(tasks: Task[], battery: Battery, touching: string[], skipIds: string[], id: string): string[] {
  const shown = dealCards(tasks, battery, touching, skipIds).map((t) => t.id);
  const next = [...skipIds, id];
  const after = dealCards(tasks, battery, touching, next);
  if (after.some((t) => !shown.includes(t.id))) return next;
  return [id];
}

/** "On it": add a card to what you're touching (up to 3). Counts as acting. */
export function touch(state: State, id: string, now = new Date()): State {
  const current = touchingNow(state, todayStr(now));
  if (current.includes(id) || current.length >= MAX_CARDS) return markActed(state, now);
  const startedAt = current.length ? state.warmup!.startedAt : now.toISOString();
  return markActed({ ...state, warmup: { startedAt, touching: [...current, id] } }, now);
}

export function setAside(state: State, id: string): State {
  if (!state.warmup) return state;
  return { ...state, warmup: { ...state.warmup, touching: state.warmup.touching.filter((x) => x !== id) } };
}

/** Mark a card's task done straight from warm-up. */
export function finishCard(state: State, id: string, now = new Date()): State {
  return markActed(setAside({ ...state, tasks: completeTask(state.tasks, id, now) }, id), now);
}

/**
 * Lock in on one task: start its 25-minute cycle, note the warm-up in the
 * journal (what you touched, what you chose), and clear the warm-up.
 */
export function focusOn(state: State, id: string, now = new Date()): State {
  if (activeCycle(state)) return state;
  const touched = touchingNow(state, todayStr(now));
  let s = startCycle({ ...state, warmup: undefined }, id, now);
  if (touched.length) {
    const title = (tid: string) => s.tasks.find((t) => t.id === tid)?.title ?? 'deleted task';
    const others = touched.filter((t) => t !== id);
    const text = others.length
      ? `Warmed up on ${touched.map(title).join(' · ')} → focused on ${title(id)}`
      : `Warmed up on ${title(id)}, then focused on it`;
    s = {
      ...s,
      journal: [
        ...s.journal,
        { id: newId(), date: todayStr(now), type: 'warmup', text, cycleId: activeCycle(s)!.id },
      ],
    };
  }
  return s;
}
