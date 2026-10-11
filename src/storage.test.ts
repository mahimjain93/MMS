import { describe, expect, it } from 'vitest';
import { defaultState, migrate, parse, todayStr } from './storage';
import { markActed, recordOpen } from './logic/state';

describe('migrate / parse', () => {
  it('turns bad JSON into the default state', () => {
    expect(parse('{not json')).toEqual(defaultState());
  });

  it('turns empty storage into the default state', () => {
    expect(parse(null)).toEqual(defaultState());
  });

  it('turns an unknown shape into the default state', () => {
    expect(migrate({ xp: 9000 })).toEqual(defaultState());
    expect(migrate('hello')).toEqual(defaultState());
  });

  it('upgrades v1 data without losing anything', () => {
    const s = migrate({ schemaVersion: 1, days: [{ date: '2026-10-10', battery: 'low' }] });
    expect(s.schemaVersion).toBe(4);
    expect(s.days).toEqual([{ date: '2026-10-10', battery: 'low' }]);
  });

  it('v2 -> v3 moves an after-midnight session to the day it started', () => {
    const ist = (t: string) => new Date(`${t}+05:30`).toISOString();
    const s = migrate({
      schemaVersion: 2,
      tasks: [],
      opens: [{ at: ist('2026-10-11T01:25:00') }, { at: ist('2026-10-11T01:40:00') }],
      days: [{ date: '2026-10-11', battery: 'low', mood: 'anxious' }],
      cycles: [{ id: 'c1', date: '2026-10-11', startedAt: ist('2026-10-11T01:45:00'), endedAt: ist('2026-10-11T01:50:00') }],
      journal: [{ id: 'j1', date: '2026-10-11', type: 'cycle', text: '', cycleId: 'c1' }],
    });
    expect(s.days).toEqual([{ date: '2026-10-10', battery: 'low', mood: 'anxious' }]);
    expect(s.cycles[0].date).toBe('2026-10-10');
    expect(s.journal[0].date).toBe('2026-10-10');
  });

  it('v3 data is not re-dated, and upgrades to v4', () => {
    const days = [{ date: '2026-10-11', battery: 'low', at: '2026-10-10T20:25:00.000Z' }];
    const s = migrate({ schemaVersion: 3, days, opens: [{ at: '2026-10-10T19:55:00.000Z' }] });
    expect(s.days).toEqual(days);
    expect(s.schemaVersion).toBe(4);
    expect(s.warmup).toBeUndefined();
  });

  it('keeps a valid warm-up and drops a broken one', () => {
    const warmup = { startedAt: '2026-10-11T18:40:00.000Z', touching: ['a'] };
    expect(migrate({ schemaVersion: 4, warmup }).warmup).toEqual(warmup);
    expect(migrate({ schemaVersion: 4, warmup: { touching: 'x' } }).warmup).toBeUndefined();
  });

  it('keeps valid v1 data and repairs missing arrays', () => {
    const s = migrate({ schemaVersion: 1, tasks: [{ id: 'a', title: 'A', createdAt: 'x' }] });
    expect(s.tasks).toHaveLength(1);
    expect(s.opens).toEqual([]);
  });
});

describe('todayStr', () => {
  it('formats a local date', () => {
    expect(todayStr(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('counts the hours before 4 AM as the previous day', () => {
    expect(todayStr(new Date(2026, 9, 11, 1, 55))).toBe('2026-10-10');
    expect(todayStr(new Date(2026, 9, 11, 3, 59))).toBe('2026-10-10');
    expect(todayStr(new Date(2026, 9, 11, 4, 0))).toBe('2026-10-11');
  });
});

describe('opens', () => {
  it('marks only the latest open, only once', () => {
    const t1 = new Date('2026-10-11T01:00:00Z');
    const t2 = new Date('2026-10-11T01:01:00Z');
    let s = recordOpen(recordOpen(defaultState(), t1), t1);
    s = markActed(s, t1);
    s = markActed(s, t2);
    expect(s.opens[0].actedAt).toBeUndefined();
    expect(s.opens[1].actedAt).toBe(t1.toISOString());
  });
});
