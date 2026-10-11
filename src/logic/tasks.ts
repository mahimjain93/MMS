import { newId, type State, type Task } from '../storage';
import { completeTask } from './cycles';

export function renameTask(state: State, id: string, title: string): State {
  const t = title.trim();
  if (!t) return state;
  return { ...state, tasks: state.tasks.map((x) => (x.id === id ? { ...x, title: t } : x)) };
}

export function markDone(state: State, id: string, now = new Date()): State {
  return { ...state, tasks: completeTask(state.tasks, id, now) };
}

/**
 * Add a step under a task. It sits right after the task's other steps in the
 * queue (same age as the task), so it shows up where the task would have.
 */
export function addStep(state: State, parentId: string, title: string): State {
  const t = title.trim();
  const parent = state.tasks.find((x) => x.id === parentId);
  if (!t || !parent) return state;
  const latest = state.tasks
    .filter((x) => x.parentId === parentId)
    .reduce((max, x) => Math.max(max, new Date(x.createdAt).getTime()), new Date(parent.createdAt).getTime());
  const step: Task = { id: newId(), title: t, parentId, createdAt: new Date(latest + 1).toISOString() };
  return { ...state, tasks: [...state.tasks, step] };
}

/**
 * Undo a Done. If finishing this had also finished the task it belongs to
 * (and that one's parent...), those reopen too: a task can't be done while one
 * of its steps is open.
 */
export function undoDone(state: State, id: string): State {
  const byId = new Map(state.tasks.map((x) => [x.id, x]));
  const reopen = new Set<string>();
  let cur = byId.get(id);
  if (!cur?.doneAt) return state;
  reopen.add(cur.id);
  while (cur?.parentId) {
    const parent = byId.get(cur.parentId);
    if (!parent?.doneAt) break;
    reopen.add(parent.id);
    cur = parent;
  }
  return {
    ...state,
    tasks: state.tasks.map((x) => {
      if (!reopen.has(x.id)) return x;
      const open = { ...x };
      delete open.doneAt;
      return open;
    }),
  };
}

/** Delete a task and every step split from it. Journal entries are kept. */
export function deleteTask(state: State, id: string): State {
  const gone = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const t of state.tasks) {
      if (t.parentId && gone.has(t.parentId) && !gone.has(t.id)) {
        gone.add(t.id);
        grew = true;
      }
    }
  }
  return { ...state, tasks: state.tasks.filter((t) => !gone.has(t.id)) };
}

export type TaskNode = { task: Task; steps: TaskNode[] };

/** Undone tasks as a tree, oldest first, steps under the task they came from. */
export function openTaskTree(tasks: Task[]): TaskNode[] {
  const open = tasks.filter((t) => !t.doneAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const ids = new Set(open.map((t) => t.id));
  const build = (parentId?: string): TaskNode[] =>
    open
      .filter((t) => (parentId ? t.parentId === parentId : !t.parentId || !ids.has(t.parentId)))
      .map((task) => ({ task, steps: build(task.id) }));
  return build();
}
