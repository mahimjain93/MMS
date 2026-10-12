import { describe, expect, it } from 'vitest';
import { defaultState } from '../storage';
import { finishBreathwork, messageAt, phaseAt, SESSION_S } from './breath';
import { doneOn, removeRoutine } from './routines';

const at = new Date('2026-10-12T14:50:00+05:30');

describe('breath pacing', () => {
  it('runs in 4, hold 2, out 6, then repeats', () => {
    expect(phaseAt(0)).toEqual({ phase: 'in', left: 4 });
    expect(phaseAt(3500).phase).toBe('in');
    expect(phaseAt(4000)).toEqual({ phase: 'hold', left: 2 });
    expect(phaseAt(6000)).toEqual({ phase: 'out', left: 6 });
    expect(phaseAt(11_900).phase).toBe('out');
    expect(phaseAt(12_000)).toEqual({ phase: 'in', left: 4 });
  });

  it('messages: steady, then the peak at halfway, then landing', () => {
    expect(messageAt(SESSION_S)).toMatch(/Autopilot/);
    expect(messageAt(SESSION_S / 2)).toMatch(/wave is peaking/);
    expect(messageAt(0)).toMatch(/created space/);
  });
});

describe('finishing breathwork', () => {
  it('writes a journal line and ticks Breathwork after a minute or more', () => {
    const s = finishBreathwork(defaultState(), { seconds: 180, note: ' wanted a smoke ', coping: ['Water', 'Walk'] }, at);
    expect(s.journal[0]).toMatchObject({ type: 'note', date: '2026-10-12', text: 'Breathwork · 3 min · also: water, walk — wanted a smoke' });
    expect(doneOn(s, '2026-10-12').has('r-breathwork')).toBe(true);
  });

  it('under a minute: journal only', () => {
    const s = finishBreathwork(defaultState(), { seconds: 40, note: '', coping: [] }, at);
    expect(s.journal[0].text).toBe('Breathwork · 40s');
    expect(doneOn(s, '2026-10-12').size).toBe(0);
  });

  it('a second session the same day does not double-log', () => {
    let s = finishBreathwork(defaultState(), { seconds: 90, note: '', coping: [] }, at);
    s = finishBreathwork(s, { seconds: 200, note: '', coping: [] }, at);
    expect(s.routineLog).toHaveLength(1);
    expect(s.journal.map((j) => j.text)).toEqual(['Breathwork · 1 min 30s', 'Breathwork · 3 min 20s']);
  });

  it('works without a Breathwork routine', () => {
    const s = finishBreathwork(removeRoutine(defaultState(), 'r-breathwork'), { seconds: 180, note: '', coping: [] }, at);
    expect(s.routineLog).toEqual([]);
    expect(s.journal).toHaveLength(1);
  });
});
