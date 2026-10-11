import type { ReactNode } from 'react';
import type { Task } from '../storage';

type Props = {
  cards: Task[];
  /** Ids of cards you're touching, in the order you picked them up. */
  touching: string[];
  since?: string;
  parentTitle: (task: Task) => string | undefined;
  canSwap: boolean;
  onTouch: (id: string) => void;
  onSetAside: (id: string) => void;
  onFocus: (id: string) => void;
  onDone: (id: string) => void;
  onSwap: (id: string) => void;
  onSplit: (id: string) => void;
  onJustStart: () => void;
  onAdd: () => void;
};

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const GRID = ['', 'mx-auto max-w-md', 'md:grid-cols-2', 'md:grid-cols-3'];

function JustStart({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="py-2 text-base text-amber-200/80 transition hover:text-amber-200">
      ⚡ Just start
    </button>
  );
}

function Link({ onClick, children, label }: { onClick: () => void; children: ReactNode; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="text-stone-500 underline-offset-4 hover:text-stone-300 hover:underline">
      {children}
    </button>
  );
}

export function Warmup(p: Props) {
  if (p.cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-xl text-stone-400">Nothing here yet</p>
        <button
          onClick={p.onAdd}
          className="rounded-2xl bg-amber-300 px-8 py-5 text-xl font-semibold text-stone-950 transition active:scale-[0.98]"
        >
          + Add task
        </button>
        <JustStart onClick={p.onJustStart} />
      </div>
    );
  }

  const warming = p.touching.length > 0;

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-stone-500">
          {warming ? `Warming up${p.since ? ` since ${time(p.since)}` : ''}` : 'Warm up'}
        </p>
        <p className="mt-1 text-stone-400">
          {warming ? 'When one pulls you in, focus on it.' : 'Touch one, two or three. No timer yet.'}
        </p>
      </div>

      <ul className={`grid w-full grid-cols-1 gap-3 ${GRID[p.cards.length]}`}>
        {p.cards.map((task) => {
          const on = p.touching.includes(task.id);
          const parent = p.parentTitle(task);
          const name = task.title;
          return (
            <li
              key={task.id}
              data-testid="card"
              className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 transition md:min-h-44 md:gap-5 md:p-5 ${
                on ? 'border-amber-300 bg-amber-300/5' : 'border-stone-800 bg-stone-900/60'
              }`}
            >
              <div className="flex flex-col gap-1.5">
                {parent && (
                  <p className="truncate text-xs uppercase tracking-wider text-stone-500" title={parent}>
                    Part of · {parent}
                  </p>
                )}
                <h2 className="text-lg leading-snug font-semibold break-words md:text-xl" data-testid="card-title">
                  {name}
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {on ? (
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <button
                      onClick={() => p.onFocus(task.id)}
                      className="rounded-xl bg-amber-300 py-3 font-semibold text-stone-950 transition active:scale-[0.98]"
                    >
                      Focus · 25 min
                    </button>
                    <button
                      onClick={() => p.onDone(task.id)}
                      aria-label={`Done: ${name}`}
                      className="rounded-xl border border-stone-700 px-4 text-stone-300 transition hover:border-emerald-300 hover:text-emerald-300"
                    >
                      ✓ Done
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => p.onTouch(task.id)}
                    className="rounded-xl border border-amber-300/60 py-2.5 font-medium text-amber-200 transition hover:bg-amber-300/10 md:py-3 active:scale-[0.98]"
                  >
                    On it
                  </button>
                )}
                <div className="flex justify-center gap-4 text-sm">
                  {on ? (
                    <Link onClick={() => p.onSetAside(task.id)} label={`Set aside: ${name}`}>
                      Set aside
                    </Link>
                  ) : (
                    p.canSwap && (
                      <Link onClick={() => p.onSwap(task.id)} label={`Swap: ${name}`}>
                        Swap
                      </Link>
                    )
                  )}
                  <Link onClick={() => p.onSplit(task.id)} label={`Too big: ${name}`}>
                    Too big
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <JustStart onClick={p.onJustStart} />
    </div>
  );
}
