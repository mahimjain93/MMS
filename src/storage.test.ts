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

  it('upgrades v1 data to v2 without losing anything', () => {
    const s = migrate({ schemaVersion: 1, days: [{ date: '2026-10-10', battery: 'low' }] });
    expect(s.schemaVersion).toBe(2);
    expect(s.days).toEqual([{ date: '2026-10-10', battery: 'low' }]);
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
