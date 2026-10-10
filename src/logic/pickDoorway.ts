import type { Battery, Task } from '../storage';

const byOldest = (a: Task, b: Task) => a.createdAt.localeCompare(b.createdAt);

/** Undone tasks that can be offered. A task that has been split is replaced by its undone steps. */
export function candidates(tasks: Task[]): Task[] {
  const hasOpenSteps = new Set(tasks.filter((t) => t.parentId && !t.doneAt).map((t) => t.parentId));
  return tasks.filter((t) => !t.doneAt && !hasOpenSteps.has(t.id));
}

/**
 * The one task to show. Low battery prefers the smallest step (a task that came
 * from a split); otherwise the oldest undone task wins.
 */
export function pickDoorway(tasks: Task[], battery: Battery, skipIds: string[] = []): Task | null {
  const skip = new Set(skipIds);
  const pool = candidates(tasks).filter((t) => !skip.has(t.id)).sort(byOldest);
  if (pool.length === 0) return null;
  if (battery === 'low') {
    const step = pool.find((t) => t.parentId);
    if (step) return step;
  }
  return pool[0];
}

/**
 * Skip list after pressing "Not this one" on `currentId`.
 * When everything has been skipped, start the round again — but not with the
 * task just dismissed, unless it's the only one.
 */
export function skipNext(tasks: Task[], battery: Battery, skipIds: string[], currentId: string): string[] {
  const next = [...skipIds, currentId];
  if (pickDoorway(tasks, battery, next)) return next;
  if (pickDoorway(tasks, battery, [currentId])) return [currentId];
  return skipIds;
}
