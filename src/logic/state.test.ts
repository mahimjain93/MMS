import { describe, expect, it } from 'vitest';
import { defaultState } from '../storage';
import { checkIn, dayFor } from './state';

describe('checkIn', () => {
  it('records battery and optional mood, and editing replaces the day', () => {
    let s = checkIn(defaultState(), 'low', undefined, '2026-10-11');
    expect(dayFor(s, '2026-10-11')).toEqual({ date: '2026-10-11', battery: 'low' });
    s = checkIn(s, 'half', 'anxious', '2026-10-11');
    expect(s.days).toEqual([{ date: '2026-10-11', battery: 'half', mood: 'anxious' }]);
  });
});
