import { newId, todayStr, type State } from '../storage';
import { activeRoutines, doneOn } from './routines';

/** Seconds per phase: a longer out-breath than in-breath settles the body. */
export const BREATH = { in: 4, hold: 2, out: 6 } as const;
export type BreathPhase = keyof typeof BREATH;
export const CYCLE_S = BREATH.in + BREATH.hold + BREATH.out;
export const SESSION_S = 3 * 60;

/** Where in the breath you are, `elapsedMs` after starting. */
export function phaseAt(elapsedMs: number): { phase: BreathPhase; left: number } {
  const t = (elapsedMs / 1000) % CYCLE_S;
  if (t < BREATH.in) return { phase: 'in', left: Math.ceil(BREATH.in - t) };
  if (t < BREATH.in + BREATH.hold) return { phase: 'hold', left: Math.ceil(BREATH.in + BREATH.hold - t) };
  return { phase: 'out', left: Math.ceil(CYCLE_S - t) };
}

/** The line on screen, from the very first version: steady, then the peak, then the landing. */
export function messageAt(remainingS: number, totalS = SESSION_S): string {
  if (remainingS <= 0) return 'You created space between impulse and action.';
  if (remainingS <= totalS / 2) return 'The wave is peaking. Hold position.';
  return 'Autopilot detected. Stabilize before acting.';
}

export const COPING = ['Walk', 'Water', 'Stretch', 'Cold water'] as const;

/** The routine that breathwork counts towards, if you have one. */
export function breathworkRoutineId(state: State): string | undefined {
  const routines = activeRoutines(state);
  return (routines.find((r) => r.id === 'r-breathwork') ?? routines.find((r) => /breath/i.test(r.title)))?.id;
}

const fmt = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60}s` : ''}` : `${s}s`);

/**
 * Close a breathwork session: a journal line (how long, what helped, what was
 * pulling at you) and, after a minute or more, today's Breathwork routine ticks.
 */
export function finishBreathwork(
  state: State,
  session: { seconds: number; note: string; coping: string[] },
  now = new Date(),
): State {
  const seconds = Math.max(0, Math.round(session.seconds));
  const parts = [`Breathwork · ${fmt(seconds)}`];
  if (session.coping.length) parts.push(`also: ${session.coping.join(', ').toLowerCase()}`);
  const note = session.note.trim();
  const text = parts.join(' · ') + (note ? ` — ${note}` : '');
  const date = todayStr(now);
  let s: State = { ...state, journal: [...state.journal, { id: newId(), date, type: 'note', text }] };

  const rid = breathworkRoutineId(s);
  if (seconds >= 60 && rid && !doneOn(s, date).has(rid)) {
    s = { ...s, routineLog: [...s.routineLog, { routineId: rid, date, at: now.toISOString() }] };
  }
  return s;
}
