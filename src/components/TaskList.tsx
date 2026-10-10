import { useState } from 'react';
import { openTaskTree, type TaskNode } from '../logic/tasks';
import type { Task } from '../storage';

type Props = {
  tasks: Task[];
  onRename: (id: string, title: string) => void;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

function Row({ node, depth, ...actions }: { node: TaskNode; depth: number } & Omit<Props, 'tasks' | 'onClose'>) {
  const { task } = node;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = () => {
    actions.onRename(task.id, title);
    setEditing(false);
  };

  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900/60 px-3 py-2"
        style={{ marginLeft: depth * 20 }}
      >
        {editing ? (
          <form
            className="flex min-w-0 flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === 'Escape' && (setTitle(task.title), setEditing(false))}
              aria-label="Task title"
              className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-stone-950 px-2 py-1 outline-none"
            />
          </form>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="min-w-0 flex-1 py-1 text-left break-words"
            title="Tap to rename"
          >
            {depth > 0 && <span className="mr-1 text-stone-500">↳</span>}
            {task.title}
          </button>
        )}
        {!editing && (
          <>
            <button
              onClick={() => actions.onDone(task.id)}
              aria-label={`Mark ${task.title} done`}
              className="rounded-lg px-2 py-1 text-stone-400 hover:text-emerald-300"
            >
              ✓
            </button>
            {confirmDelete ? (
              <button
                onClick={() => actions.onDelete(task.id)}
                onBlur={() => setConfirmDelete(false)}
                autoFocus
                className="rounded-lg bg-red-500/20 px-2 py-1 text-sm text-red-300"
              >
                Delete{node.steps.length ? ' + steps' : ''}?
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label={`Delete ${task.title}`}
                className="rounded-lg px-2 py-1 text-stone-500 hover:text-red-300"
              >
                ✕
              </button>
            )}
          </>
        )}
      </div>
      {node.steps.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {node.steps.map((s) => (
            <Row key={s.task.id} node={s} depth={depth + 1} {...actions} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TaskList({ tasks, onClose, ...actions }: Props) {
  const tree = openTaskTree(tasks);
  const doneToday = tasks.filter((t) => t.doneAt && new Date(t.doneAt).toDateString() === new Date().toDateString());

  return (
    <div className="flex w-full max-w-md flex-col gap-5 self-start">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All tasks</h1>
        <button onClick={onClose} className="text-stone-400 underline underline-offset-4">
          Close
        </button>
      </div>
      <p className="text-sm text-stone-500">Oldest first. Tap a task to rename it.</p>
      {tree.length === 0 ? (
        <p className="text-stone-500">Nothing waiting.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tree.map((n) => (
            <Row key={n.task.id} node={n} depth={0} {...actions} />
          ))}
        </ul>
      )}
      {doneToday.length > 0 && (
        <p className="text-sm text-stone-500">
          Done today: {doneToday.map((t) => t.title).join(' · ')}
        </p>
      )}
    </div>
  );
}
