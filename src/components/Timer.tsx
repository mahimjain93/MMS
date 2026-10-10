import { useEffect, useState } from 'react';
import { CYCLE_MS, remainingMs } from '../logic/cycles';
import type { Cycle } from '../storage';

const fmt = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

type Props = { cycle: Cycle; title?: string; onEnd: () => void };

export function Timer({ cycle, title, onEnd }: Props) {
  const [now, setNow] = useState(() => new Date());
  const left = remainingMs(cycle, now);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (left === 0) onEnd();
  }, [left, onEnd]);

  useEffect(() => {
    document.title = `${fmt(left)} · MMS`;
    return () => {
      document.title = 'MMS';
    };
  }, [left]);

  const progress = 1 - left / CYCLE_MS;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
      <p className="text-sm uppercase tracking-widest text-stone-500">{title ? 'On it' : 'Just started'}</p>
      {title && <h1 className="text-2xl leading-snug font-semibold break-words">{title}</h1>}
      <div className="text-7xl font-light tabular-nums tracking-tight" data-testid="timer">
        {fmt(left)}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-stone-800">
        <div className="h-full bg-amber-300 transition-[width] duration-1000" style={{ width: `${progress * 100}%` }} />
      </div>
      <button onClick={onEnd} className="text-stone-400 underline underline-offset-4">
        End early
      </button>
    </div>
  );
}
