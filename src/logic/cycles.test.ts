import { describe, expect, it } from 'vitest';
import { defaultState, type State } from '../storage';
import { addTask, recordOpen } from './state';
import { activeCycle, addNote, CYCLE_MS, finishCycle, remainingMs, splitTask, startCycle } from './cycles';
import { pickDoorway } from './pickDoorway';

const t0 = new Date('2026-10-11T04:00:00Z');
const later = (ms: number) => new Date(t0.getTime() + ms);

function withTasks(...titles: string[]): State {
  let s = recordOpen(defaultState(), t0);
  titles.forEach((title, i) => (s = addTask(s, title, later(i * 60_000))));
  return s;
}

describe('cycles', () => {
  it('starts a cycle on a task and counts as acting', () => {
    const s = startCycle(withTasks('A'), withTasks('A').tasks[0]?.id, t0);
    expect(activeCycle(s)).toBeDefined();
    expect(s.opens[0].actedAt).toBe(t0.toISOString());
  });

  it('JUST START runs a cycle with no task', () => {
    const s = startCycle(withTasks(), undefined, t0);
    expect(activeCycle(s)?.taskId).toBeUndefined();
  });

  it('does not start a second cycle while one is running', () => {
    const s1 = startCycle(withTasks(), undefined, t0);
    const s2 = startCycle(s1, undefined, later(1000));
    expect(s2.cycles).toHaveLength(1);
  });

  it('counts down and stops at zero', () => {
    const s = startCycle(withTasks(), undefined, t0);
    const c = activeCycle(s)!;
    expect(remainingMs(c, later(60_000))).toBe(CYCLE_MS - 60_000);
    expect(remainingMs(c, later(CYCLE_MS + 5_000))).toBe(0);
  });

  it('finishing marks the task done and writes one journal entry', () => {
    let s = withTasks('A');
    s = startCycle(s, s.tasks[0].id, t0);
    s = finishCycle(s, { done: true, note: '  went fine ' }, later(CYCLE_MS));
    expect(activeCycle(s)).toBeUndefined();
    expect(s.tasks[0].doneAt).toBeDefined();
    expect(s.journal).toEqual([expect.objectContaining({ type: 'cycle', text: 'went fine', cycleId: s.cycles[0].id })]);
  });

  it('"not yet" leaves the task open', () => {
    let s = withTasks('A');
    s = startCycle(s, s.tasks[0].id, t0);
    s = finishCycle(s, { done: false, note: '' }, later(1000));
    expect(s.tasks[0].doneAt).toBeUndefined();
    expect(s.journal).toHaveLength(1);
  });
});

describe('splitTask', () => {
  it('puts the first step where the task was', () => {
    let s = withTasks('Big email', 'Clean desk');
    s = splitTask(s, s.tasks[0].id, ['Open the draft', '', 'Write one line']);
    expect(s.tasks).toHaveLength(4);
    expect(pickDoorway(s.tasks, 'full')?.title).toBe('Open the draft');
  });

  it('finishing the last step finishes the task it came from', () => {
    let s = withTasks('Big email');
    const big = s.tasks[0].id;
    s = splitTask(s, big, ['Step 1', 'Step 2']);
    for (const step of s.tasks.filter((t) => t.parentId === big)) {
      s = startCycle(s, step.id, t0);
      s = finishCycle(s, { done: true, note: '' }, later(1000));
    }
    expect(s.tasks.find((t) => t.id === big)?.doneAt).toBeDefined();
    expect(pickDoorway(s.tasks, 'full')).toBeNull();
  });

  it('ignores a split with no steps', () => {
    const s = withTasks('A');
    expect(splitTask(s, s.tasks[0].id, ['', '  '])).toBe(s);
  });
});

describe('addNote', () => {
  it('adds a note and ignores empty ones', () => {
    let s = addNote(withTasks(), '  felt heavy today ', t0);
    s = addNote(s, '   ', t0);
    expect(s.journal).toEqual([expect.objectContaining({ type: 'note', text: 'felt heavy today' })]);
  });
});
