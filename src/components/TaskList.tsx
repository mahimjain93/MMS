import { useState } from 'react';
import { openTaskTree, type TaskNode } from '../logic/tasks';
import { todayStr, type Task } from '../storage';

type Props = {
  tasks: Task[];
  onRename: (id: string, title: string) => void;
  onAddStep: (parentId: string, title: string) => void;
  onDone: (id: string) => void;
  onUndo: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

type RowActions = Pick<Props, 'onRename' | 'onAddStep' | 'onDone' | 'onDelete'>;

const iconBtn = 'shrink-0 rounded-lg px-2 py-1 text-stone-400';

function AddStep({ depth, title, onAdd, onClose }: { depth: number; title: string; onAdd: (t: string) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  return (
    <form
      className="flex gap-2"
      style={{ marginLeft: (depth + 1) * 20 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onAdd(text);
        setText('');
      }}
    >
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        placeholder="Add a step — Enter for the next one"
        aria-label={`New step for ${title}`}
        enterKeyHint="done"
        className="min-w-0 flex-1 rounded-xl border border-amber-300 bg-stone-950 px-3 py-2 outline-none"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="rounded-xl bg-amber-300 px-3 font-semibold text-stone-950 disabled:opacity-40"
      >
        Add
      </button>
      <button type="button" onClick={onClose} className="px-1 text-stone-500" aria-label="Stop adding steps">
        ✕
      </button>
    </form>
  );
}

function Row({ node, depth, ...actions }: { node: TaskNode; depth: number } & RowActions) {
  const { task } = node;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingStep, setAddingStep] = useState(false);

  const save = () => {
    actions.onRename(task.id, title);
    setEditing(false);
  };

  return (
    <li className="flex flex-col gap-2">
      <div
        className="flex items-center gap-1 rounded-xl border border-stone-800 bg-stone-900/60 px-3 py-2"
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
            className="font-body min-w-0 flex-1 py-1 text-left break-words"
            title="Tap to rename"
          >
            {depth > 0 && <span className="mr-1 text-stone-500">↳</span>}
            {task.title}
            {node.steps.length > 0 && <span className="ml-2 text-sm text-stone-500">· {node.steps.length} {node.steps.length === 1 ? 'step' : 'steps'}</span>}
          </button>
        )}
        {!editing && (
          <>
            <button
              onClick={() => setAddingStep((v) => !v)}
              aria-label={`Add step to ${task.title}`}
              title="Add a step"
              className={`${iconBtn} ${addingStep ? 'text-amber-200' : 'hover:text-amber-200'}`}
            >
              +
            </button>
            <button
              onClick={() => actions.onDone(task.id)}
              aria-label={`Mark ${task.title} done`}
              title="Done"
              className={`${iconBtn} hover:text-emerald-300`}
            >
              ✓
            </button>
            {confirmDelete ? (
              <button
                onClick={() => actions.onDelete(task.id)}
                onBlur={() => setConfirmDelete(false)}
                autoFocus
                className="shrink-0 rounded-lg bg-red-500/20 px-2 py-1 text-sm text-red-300"
              >
                Delete{node.steps.length ? ' + steps' : ''}?
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label={`Delete ${task.title}`}
                title="Delete"
                className={`${iconBtn} text-stone-500 hover:text-red-300`}
              >
                ✕
              </button>
            )}
          </>
        )}
      </div>
      {node.steps.length > 0 && (
        <ul className="flex flex-col gap-2">
          {node.steps.map((s) => (
            <Row key={s.task.id} node={s} depth={depth + 1} {...actions} />
          ))}
        </ul>
      )}
      {addingStep && (
        <AddStep
          depth={depth}
          title={task.title}
          onAdd={(t) => actions.onAddStep(task.id, t)}
          onClose={() => setAddingStep(false)}
        />
      )}
    </li>
  );
}

export function TaskList({ tasks, onClose, onUndo, ...actions }: Props) {
  const tree = openTaskTree(tasks);
  const today = todayStr();
  const doneToday = tasks
    .filter((t) => t.doneAt && todayStr(new Date(t.doneAt)) === today)
    .sort((a, b) => b.doneAt!.localeCompare(a.doneAt!));

  return (
    <div className="flex w-full max-w-3xl flex-col gap-5 self-start">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All tasks</h1>
        <button onClick={onClose} className="text-stone-400 underline underline-offset-4">
          Close
        </button>
      </div>
      <p className="text-sm text-stone-500">Oldest first. Tap a task to rename it, + to add a step.</p>
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
        <section className="flex flex-col gap-2" aria-labelledby="done-today">
          <h2 id="done-today" className="text-sm uppercase tracking-widest text-stone-500">
            Done today
          </h2>
          <ul className="flex flex-col gap-1">
            {doneToday.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-1.5 text-stone-500">
                <span className="text-emerald-300">✓</span>
                <span className="min-w-0 flex-1 break-words line-through decoration-stone-600">{t.title}</span>
                <button
                  onClick={() => onUndo(t.id)}
                  aria-label={`Undo done: ${t.title}`}
                  className="shrink-0 rounded-lg px-2 py-1 text-sm text-stone-400 underline-offset-4 hover:text-stone-200 hover:underline"
                >
                  Undo
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
