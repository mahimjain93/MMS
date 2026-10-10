import type { State, Task } from '../storage';
import { completeTask } from './cycles';

export function renameTask(state: State, id: string, title: string): State {
  const t = title.trim();
  if (!t) return state;
  return { ...state, tasks: state.tasks.map((x) => (x.id === id ? { ...x, title: t } : x)) };
}

export function markDone(state: State, id: string, now = new Date()): State {
  return { ...state, tasks: completeTask(state.tasks, id, now) };
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
