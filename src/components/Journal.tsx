import { useState } from 'react';
import { todayStr, type State } from '../storage';
import { BatteryIcon } from './BatteryIcon';
import { moodLabel } from './CheckIn';
import { routinesDoneOn } from '../logic/routines';

type Props = { state: State; onNote: (text: string) => void; onClose: () => void };

const time = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

/** '2026-10-11' -> 'Sun 11 Oct' */
const dayLabel = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
};

const SHOW_FIRST = 7;

export function Journal({ state, onNote, onClose }: Props) {
  const [text, setText] = useState('');
  const [showAll, setShowAll] = useState(false);
  const cycles = new Map(state.cycles.map((c) => [c.id, c]));
  const tasks = new Map(state.tasks.map((t) => [t.id, t]));
  const today = todayStr();

  const byDate = new Map<string, typeof state.journal>();
  [...state.journal].reverse().forEach((e) => byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]));

  const checkIns = [...state.days].sort((a, b) => b.date.localeCompare(a.date));
  const cyclesOn = (date: string) => state.cycles.filter((c) => c.date === date && c.endedAt).length;
  const shown = showAll ? checkIns : checkIns.slice(0, SHOW_FIRST);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6 self-start">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Journal</h1>
        <button onClick={onClose} className="text-stone-400 underline underline-offset-4">
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Check-in history */}
        <section className="flex flex-col gap-3" aria-labelledby="checkins-heading">
          <h2 id="checkins-heading" className="text-sm uppercase tracking-widest text-stone-500">
            Check-ins
          </h2>
          {checkIns.length === 0 ? (
            <p className="text-stone-500">None yet.</p>
          ) : (
            <ul className="divide-y divide-stone-800 rounded-xl border border-stone-800 bg-stone-900/60">
              {shown.map((d) => {
                const n = cyclesOn(d.date);
                const routines = routinesDoneOn(state, d.date);
                return (
                  <li key={d.date} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
                    <span className={d.date === today ? 'font-semibold' : 'text-stone-300'}>
                      {d.date === today ? 'Today' : dayLabel(d.date)}
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-stone-400">
                        <BatteryIcon level={d.battery} />
                      </span>
                      <span className="capitalize">{d.battery}</span>
                      {d.mood && <span className="truncate text-stone-500">· {moodLabel(d.mood)}</span>}
                    </span>
                    <span className="text-stone-500">
                      {n} {n === 1 ? 'cycle' : 'cycles'}
                    </span>
                    {routines.length > 0 && (
                      <span className="col-span-3 -mt-1 text-xs text-emerald-300">
                        {routines.map((r) => `✓ ${r}`).join('   ')}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {checkIns.length > SHOW_FIRST && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="self-start text-sm text-stone-400 underline underline-offset-4"
            >
              {showAll ? 'Show fewer' : `Show all ${checkIns.length} days`}
            </button>
          )}
        </section>

        {/* Entries */}
        <section className="flex flex-col gap-6" aria-label="Entries">
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
            <div key={date} className="flex flex-col gap-3">
              <h2 className="text-sm uppercase tracking-widest text-stone-500">
                {date === today ? 'Today' : dayLabel(date)}
              </h2>
              {entries.map((e) => {
                const cycle = e.cycleId ? cycles.get(e.cycleId) : undefined;
                const task = cycle?.taskId ? tasks.get(cycle.taskId) : undefined;
                return (
                  <article key={e.id} className="rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3">
                    <div className="flex justify-between gap-3 text-sm text-stone-500">
                      <span className="break-words">
                        {e.type === 'cycle'
                          ? `Cycle · ${task ? task.title : cycle?.taskId ? 'deleted task' : 'Just start'}`
                          : e.type === 'warmup'
                            ? 'Warm-up'
                            : 'Note'}
                      </span>
                      <span className="shrink-0">
                        {time(e.type === 'warmup' ? cycle?.startedAt : (cycle?.endedAt ?? cycle?.startedAt))}
                      </span>
                    </div>
                    {e.text && <p className="mt-1 break-words">{e.text}</p>}
                  </article>
                );
              })}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
