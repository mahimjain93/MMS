import { describe, expect, it } from 'vitest';
import { defaultState, type State } from '../storage';
import { addTask } from './state';
import { splitTask } from './cycles';
import { deleteTask, markDone, openTaskTree, renameTask } from './tasks';

const t0 = new Date('2026-10-11T04:00:00Z');
function withTasks(...titles: string[]): State {
  let s = defaultState();
  titles.forEach((title, i) => (s = addTask(s, title, new Date(t0.getTime() + i * 60_000))));
  return s;
}

describe('task list', () => {
  it('renames, ignoring blank titles', () => {
    let s = withTasks('tset 2');
    s = renameTask(s, s.tasks[0].id, ' test 2 ');
    expect(s.tasks[0].title).toBe('test 2');
    expect(renameTask(s, s.tasks[0].id, '  ').tasks[0].title).toBe('test 2');
  });

  it('deleting a task deletes its steps too', () => {
    let s = withTasks('Big', 'Other');
    s = splitTask(s, s.tasks[0].id, ['a', 'b']);
    s = deleteTask(s, s.tasks[0].id);
    expect(s.tasks.map((t) => t.title)).toEqual(['Other']);
  });

  it('marking the last step done finishes the original', () => {
    let s = withTasks('Big');
    const big = s.tasks[0].id;
    s = splitTask(s, big, ['only step']);
    s = markDone(s, s.tasks[1].id, t0);
    expect(s.tasks.every((t) => t.doneAt)).toBe(true);
  });

  it('builds a tree of open tasks with steps nested', () => {
    let s = withTasks('Big', 'Other');
    s = splitTask(s, s.tasks[0].id, ['a', 'b']);
    s = markDone(s, s.tasks.find((t) => t.title === 'a')!.id, t0);
    const tree = openTaskTree(s.tasks);
    expect(tree.map((n) => n.task.title)).toEqual(['Big', 'Other']);
    expect(tree[0].steps.map((n) => n.task.title)).toEqual(['b']);
  });
});
