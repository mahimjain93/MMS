import { useEffect, useRef, useState } from 'react';
import { BREATH, COPING, messageAt, phaseAt, SESSION_S } from '../logic/breath';
import { playBreathCue, playChime, unlockAudio } from '../sound';

type Props = {
  onFinish: (session: { seconds: number; note: string; coping: string[] }) => void;
  onClose: () => void;
};

const LABEL = { in: 'Breathe in', hold: 'Hold', out: 'Breathe out' } as const;
/** How to breathe each phase: in through the nose, a long slow exhale through pursed lips. */
const HOW = { in: 'through your nose', hold: 'gently, no strain', out: 'slowly through your mouth' } as const;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Full-screen guided breathing: 3 minutes, a ring to follow, then a soft landing. */
export function Breathwork({ onFinish, onClose }: Props) {
  const [startedAt] = useState(() => Date.now());
  const [total, setTotal] = useState(SESSION_S);
  const [now, setNow] = useState(() => Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);
  // Time spent on the finish screen before 'Another round' doesn't count as breathing.
  const [pausedMs, setPausedMs] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [note, setNote] = useState('');
  const [coping, setCoping] = useState<string[]>([]);
  const lastPhase = useRef<string>('');

  const running = endedAt === null;
  const elapsedMs = (endedAt ?? now) - startedAt - pausedMs;
  const remaining = Math.max(0, total - Math.floor(elapsedMs / 1000));
  const { phase, left } = phaseAt(elapsedMs);
  const breathed = Math.min(total, Math.floor(elapsedMs / 1000));

  useEffect(() => {
    unlockAudio();
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && remaining === 0) {
      setEndedAt(startedAt + pausedMs + total * 1000);
      playChime();
    }
  }, [running, remaining, startedAt, pausedMs, total]);

  useEffect(() => {
    if (!running || phase === lastPhase.current) return;
    lastPhase.current = phase;
    if (phase !== 'hold') playBreathCue(phase);
  }, [running, phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && running) setEndedAt(Date.now());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running]);

  const toggle = (c: string) => setCoping((all) => (all.includes(c) ? all.filter((x) => x !== c) : [...all, c]));
  const big = !mounted ? false : phase !== 'out';

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto"
      style={{ background: 'var(--page-bg)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Breathwork"
    >
      <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center gap-8 px-4 py-10 text-center">
        <div className="flex w-full items-center justify-between text-sm text-stone-500">
          <span className="uppercase tracking-widest">Breathwork</span>
          {running ? (
            <span className="tabular-nums" data-testid="breath-remaining">
              {fmt(remaining)}
            </span>
          ) : (
            <span>{breathed >= 60 ? `${Math.round(breathed / 60)} min` : `${breathed}s`} breathed</span>
          )}
        </div>

        {running && (
          <div className="relative flex h-72 w-72 items-center justify-center" aria-live="polite">
            <div
              className="absolute inset-0 rounded-full border-2 border-amber-300 bg-amber-300/10 ease-in-out"
              style={{
                transform: `scale(${big ? 1 : 0.68})`,
                transitionProperty: 'transform',
                transitionDuration: `${phase === 'in' ? BREATH.in : phase === 'out' ? BREATH.out : 0.3}s`,
              }}
            />
            <div className="relative">
              <div className="text-2xl font-medium" data-testid="breath-phase">
                {LABEL[phase]}
              </div>
              <div className="text-sm text-stone-400" data-testid="breath-how">
                {HOW[phase]}
              </div>
              <div className="mt-1 text-stone-500 tabular-nums">{left}</div>
            </div>
          </div>
        )}

        <p className="text-xl leading-snug text-stone-300 md:text-2xl" data-testid="breath-message">
          {messageAt(running ? remaining : 0, total)}
        </p>

        {!running && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 1000))}
            placeholder="What was pulling at you? Name it. No judgment. (optional)"
            aria-label="What was pulling at you"
            rows={3}
            className="w-full resize-none rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300"
          />
        )}

        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-stone-500">Also try</span>
          <div className="flex flex-wrap justify-center gap-2">
            {COPING.map((c) => (
              <button
                key={c}
                onClick={() => toggle(c)}
                aria-pressed={coping.includes(c)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  coping.includes(c)
                    ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                    : 'border-stone-700 text-stone-400 hover:border-stone-500'
                }`}
              >
                {coping.includes(c) ? '✓ ' : ''}
                {c}
              </button>
            ))}
          </div>
        </div>

        {running ? (
          <div className="flex gap-3">
            <button
              onClick={() => setTotal((t) => t + 60)}
              className="rounded-xl border border-stone-700 px-5 py-3 text-stone-300 hover:border-stone-500"
            >
              +1 min
            </button>
            <button
              onClick={() => setEndedAt(Date.now())}
              className="rounded-xl border border-stone-700 px-5 py-3 text-stone-300 hover:border-stone-500"
            >
              End
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => onFinish({ seconds: breathed, note, coping })}
              className="rounded-2xl bg-amber-300 py-4 text-xl font-semibold text-stone-950 transition active:scale-[0.98]"
            >
              Done
            </button>
            <div className="flex justify-center gap-6 text-sm">
              <button
                onClick={() => {
                  const t = Date.now();
                  setPausedMs((p) => p + (t - (endedAt ?? t)));
                  setTotal(breathed + SESSION_S);
                  setNow(t);
                  lastPhase.current = '';
                  setEndedAt(null);
                }}
                className="text-stone-400 underline-offset-4 hover:underline"
              >
                Another round
              </button>
              <button onClick={onClose} className="text-stone-500 underline-offset-4 hover:underline">
                Close without saving
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
