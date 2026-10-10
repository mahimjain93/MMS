import { describe, expect, it } from 'vitest';
import { pickDoorway, skipNext } from './pickDoorway';
import type { Task } from '../storage';

const t = (id: string, createdAt: string, extra: Partial<Task> = {}): Task => ({
  id,
  title: id,
  createdAt,
  ...extra,
});

const old = t('old', '2026-10-01T09:00:00Z');
const mid = t('mid', '2026-10-02T09:00:00Z');
const step = t('step', '2026-10-03T09:00:00Z', { parentId: 'big' });
const big = t('big', '2026-09-01T09:00:00Z');

describe('pickDoorway', () => {
  it('returns null when there are no tasks', () => {
    expect(pickDoorway([], 'full')).toBeNull();
  });

  it('returns null when everything is done', () => {
    expect(pickDoorway([{ ...old, doneAt: '2026-10-05T00:00:00Z' }], 'half')).toBeNull();
  });

  it('picks the oldest undone task on full or half battery', () => {
    expect(pickDoorway([mid, old], 'full')?.id).toBe('old');
    expect(pickDoorway([mid, old, step], 'half')?.id).toBe('old');
  });

  it('prefers a split step on low battery', () => {
    expect(pickDoorway([old, mid, step], 'low')?.id).toBe('step');
  });

  it('falls back to the oldest task on low battery when there are no steps', () => {
    expect(pickDoorway([mid, old], 'low')?.id).toBe('old');
  });

  it('hides a split task while it still has undone steps', () => {
    expect(pickDoorway([big, step], 'full')?.id).toBe('step');
    expect(pickDoorway([big, { ...step, doneAt: '2026-10-05T00:00:00Z' }], 'full')?.id).toBe('big');
  });

  it('respects the skip list', () => {
    expect(pickDoorway([old, mid], 'full', ['old'])?.id).toBe('mid');
  });
});

describe('skipNext', () => {
  it('adds the current task to the skip list', () => {
    expect(skipNext([old, mid], 'full', [], 'old')).toEqual(['old']);
  });

  it('starts a new round when everything has been skipped, without repeating the last one', () => {
    const third = t('third', '2026-10-04T09:00:00Z');
    const skip = skipNext([old, mid, third], 'full', ['old', 'mid'], 'third');
    expect(skip).toEqual(['third']);
    expect(pickDoorway([old, mid, third], 'full', skip)?.id).toBe('old');
  });

  it('leaves things alone when there is only one task', () => {
    expect(skipNext([old], 'full', [], 'old')).toEqual([]);
  });
});
