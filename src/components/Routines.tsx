import { useState } from 'react';
import type { Routine } from '../storage';

type Props = {
  routines: Routine[];
  done: Set<string>;
  onToggle: (id: string) => void;
  onAdd: (title: string) => void;
  onRemove: (id: string) => void;
  /** The routine that can be done right here (breathwork), and how to start it. */
  startable?: string;
  onStart?: () => void;
};

/** Daily routines: a small strip above the cards. Tap to log, tap again to undo. */
export function Routines({ routines, done, onToggle, onAdd, onRemove, startable, onStart }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  return (
    <section className="flex w-full max-w-4xl flex-col items-center gap-3" aria-label="Daily rituals">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-widest text-stone-500">Daily rituals</span>
        {routines.map((r) => {
          const isDone = done.has(r.id);
          return editing ? (
            <span
              key={r.id}
              className="flex items-center gap-1 rounded-full border border-stone-700 py-1.5 pr-1.5 pl-4 text-stone-300"
            >
              {r.title}
              <button
                onClick={() => onRemove(r.id)}
                aria-label={`Remove ritual ${r.title}`}
                className="rounded-full px-2 text-stone-500 hover:text-red-300"
              >
                ✕
              </button>
            </span>
          ) : (
            <span key={r.id} className="flex items-center gap-1">
              <button
                onClick={() => onToggle(r.id)}
                aria-pressed={isDone}
                aria-label={isDone ? `${r.title}: done today. Tap to undo.` : `Log ${r.title} for today`}
                className={`rounded-full border px-4 py-1.5 transition active:scale-[0.97] ${
                  isDone
                    ? 'border-emerald-300/60 bg-emerald-300/10 text-emerald-300'
                    : 'border-stone-700 text-stone-300 hover:border-stone-500'
                }`}
              >
                {isDone ? '✓ ' : ''}
                {r.title}
              </button>
              {r.id === startable && onStart && (
                <button
                  onClick={onStart}
                  aria-label={`Start ${r.title} now`}
                  title="Start a 3-minute session"
                  className="rounded-full px-2 py-1.5 text-sm text-amber-200 hover:bg-amber-300/10"
                >
                  ▶ 3 min
                </button>
              )}
            </span>
          );
        })}
        <button
          onClick={() => setEditing((v) => !v)}
          className="px-2 text-sm text-stone-500 underline-offset-4 hover:text-stone-300 hover:underline"
        >
          {editing ? 'Done editing' : routines.length ? 'Edit' : '+ Add a ritual'}
        </button>
      </div>
      {editing && (
        <form
          className="flex w-full max-w-sm gap-2"
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
            onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
            placeholder="New ritual, e.g. Swim"
            aria-label="New ritual"
            className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 outline-none focus:border-amber-300"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="rounded-xl bg-amber-300 px-3 font-semibold text-stone-950 disabled:opacity-40"
          >
            Add
          </button>
        </form>
      )}
    </section>
  );
}
