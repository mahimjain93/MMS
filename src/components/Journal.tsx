import { useState } from 'react';
import type { State } from '../storage';

type Props = { state: State; onNote: (text: string) => void; onClose: () => void };

const time = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

export function Journal({ state, onNote, onClose }: Props) {
  const [text, setText] = useState('');
  const cycles = new Map(state.cycles.map((c) => [c.id, c]));
  const tasks = new Map(state.tasks.map((t) => [t.id, t]));

  const byDate = new Map<string, typeof state.journal>();
  [...state.journal].reverse().forEach((e) => byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]));

  return (
    <div className="flex w-full max-w-md flex-col gap-6 self-start">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Journal</h1>
        <button onClick={onClose} className="text-stone-400 underline underline-offset-4">
          Close
        </button>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onNote(text);
          setText('');
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note"
          aria-label="Journal note"
          className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300"
        />
        <button type="submit" className="rounded-xl border border-stone-700 px-4 text-stone-300">
          Add
        </button>
      </form>

      {byDate.size === 0 && <p className="text-stone-500">Nothing yet. Cycles and notes land here.</p>}

      {[...byDate].map(([date, entries]) => (
        <section key={date} className="flex flex-col gap-3">
          <h2 className="text-sm uppercase tracking-widest text-stone-500">{date}</h2>
          {entries.map((e) => {
            const cycle = e.cycleId ? cycles.get(e.cycleId) : undefined;
            const task = cycle?.taskId ? tasks.get(cycle.taskId) : undefined;
            return (
              <article key={e.id} className="rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3">
                <div className="flex justify-between gap-3 text-sm text-stone-500">
                  <span className="break-words">
                    {e.type === 'cycle' ? `Cycle · ${task ? task.title : cycle?.taskId ? 'deleted task' : 'Just start'}` : 'Note'}
                  </span>
                  <span className="shrink-0">{time(cycle?.endedAt ?? cycle?.startedAt)}</span>
                </div>
                {e.text && <p className="mt-1 break-words">{e.text}</p>}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
