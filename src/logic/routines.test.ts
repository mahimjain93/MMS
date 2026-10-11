import { describe, expect, it } from 'vitest';
import { defaultState } from '../storage';
import { activeRoutines, addRoutine, doneOn, removeRoutine, routinesDoneOn, toggleRoutine } from './routines';

const ist = (d: string, t: string) => new Date(`2026-10-${d}T${t}+05:30`);

describe('routines', () => {
  it('start with Exercise and Breathwork', () => {
    expect(activeRoutines(defaultState()).map((r) => r.title)).toEqual(['Exercise', 'Breathwork']);
  });

  it('tap logs for today, tap again undoes; a new day starts fresh', () => {
    let s = toggleRoutine(defaultState(), 'r-breathwork', ist('12', '09:00:00'));
    expect([...doneOn(s, '2026-10-12')]).toEqual(['r-breathwork']);
    expect(doneOn(s, '2026-10-13').size).toBe(0);
    s = toggleRoutine(s, 'r-breathwork', ist('12', '09:05:00'));
    expect(doneOn(s, '2026-10-12').size).toBe(0);
  });

  it('a 1 AM log counts for the day before (4 AM day)', () => {
    const s = toggleRoutine(defaultState(), 'r-exercise', ist('13', '01:00:00'));
    expect([...doneOn(s, '2026-10-12')]).toEqual(['r-exercise']);
  });

  it('add and remove; removed routines keep their history', () => {
    let s = addRoutine(defaultState(), '  Swim  ', ist('12', '10:00:00'));
    expect(activeRoutines(s).map((r) => r.title)).toEqual(['Exercise', 'Breathwork', 'Swim']);
    s = toggleRoutine(s, 'r-exercise', ist('12', '10:00:00'));
    s = removeRoutine(s, 'r-exercise');
    expect(activeRoutines(s).map((r) => r.title)).toEqual(['Breathwork', 'Swim']);
    expect(routinesDoneOn(s, '2026-10-12')).toEqual(['Exercise']);
    expect(addRoutine(s, '   ')).toBe(s);
  });
});
