import { describe, expect, it } from 'vitest';
import { defaultState } from '../storage';
import { checkIn, dayFor } from './state';

// Times in IST (+05:30), like the app's real use.
const ist = (s: string) => new Date(`${s}+05:30`);

describe('checkIn', () => {
  it('records battery, optional mood and time; editing replaces the day', () => {
    let s = checkIn(defaultState(), 'low', undefined, ist('2026-10-11T19:22:00'));
    expect(dayFor(s, '2026-10-11')).toEqual({
      date: '2026-10-11',
      battery: 'low',
      at: ist('2026-10-11T19:22:00').toISOString(),
    });
    s = checkIn(s, 'half', 'anxious', ist('2026-10-11T20:00:00'));
    expect(s.days).toEqual([expect.objectContaining({ date: '2026-10-11', battery: 'half', mood: 'anxious' })]);
  });

  it('a 2 AM check-in belongs to the previous day', () => {
    const s = checkIn(defaultState(), 'low', undefined, ist('2026-10-11T01:55:00'));
    expect(s.days[0].date).toBe('2026-10-10');
  });
});
