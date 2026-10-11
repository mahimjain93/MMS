import { describe, expect, it } from 'vitest';
import { defaultState, type State } from '../storage';
import { addTask } from './state';
import { activeCycle, splitTask } from './cycles';
import { canSwap, dealCards, finishCard, focusOn, setAside, swapCard, touch, touchingNow } from './warmup';

const ist = (t: string) => new Date(`2026-10-11T${t}+05:30`);
const t0 = ist('19:00:00');

function withTasks(...titles: string[]): State {
  let s = defaultState();
  titles.forEach((title, i) => (s = addTask(s, title, new Date(t0.getTime() + i * 60_000))));
  return s;
}
const ids = (s: State, ...titles: string[]) => titles.map((x) => s.tasks.find((t) => t.title === x)!.id);
const titles = (cards: { title: string }[]) => cards.map((c) => c.title);

describe('dealing cards', () => {
  it('deals up to 3, oldest first', () => {
    const s = withTasks('A', 'B', 'C', 'D');
    expect(titles(dealCards(s.tasks, 'full', [], []))).toEqual(['A', 'B', 'C']);
  });

  it('on Low battery, small steps come first', () => {
    let s = withTasks('Big', 'B', 'C');
    s = splitTask(s, ids(s, 'Big')[0], ['tiny step']);
    expect(titles(dealCards(s.tasks, 'low', [], []))).toEqual(['tiny step', 'B', 'C']);
  });

  it('cards you are touching stay on screen, first', () => {
    const s = withTasks('A', 'B', 'C', 'D');
    const [d] = ids(s, 'D');
    expect(titles(dealCards(s.tasks, 'full', [d], []))).toEqual(['D', 'A', 'B']);
  });

  it('swap brings in the next task, and cycles round when all have been seen', () => {
    const s = withTasks('A', 'B', 'C', 'D', 'E');
    const [a, b] = ids(s, 'A', 'B');
    let skip = swapCard(s.tasks, 'full', [], [], a);
    expect(titles(dealCards(s.tasks, 'full', [], skip))).toEqual(['B', 'C', 'D']);
    skip = swapCard(s.tasks, 'full', [], skip, b);
    expect(titles(dealCards(s.tasks, 'full', [], skip))).toEqual(['C', 'D', 'E']);
    const [c] = ids(s, 'C');
    skip = swapCard(s.tasks, 'full', [], skip, c);
    expect(titles(dealCards(s.tasks, 'full', [], skip))).toEqual(['D', 'E', 'A']);
  });

  it('a swapped-out task comes back when a slot frees up', () => {
    let s = withTasks('A', 'B', 'C', 'D');
    const [a, b, c] = ids(s, 'A', 'B', 'C');
    const skip = swapCard(s.tasks, 'full', [], [], c);
    expect(titles(dealCards(s.tasks, 'full', [], skip))).toEqual(['A', 'B', 'D']);
    s = finishCard(s, a);
    s = finishCard(s, b);
    expect(titles(dealCards(s.tasks, 'full', [], skip))).toEqual(['D', 'C']);
  });

  it('no swapping when every task is already on screen', () => {
    const s = withTasks('A', 'B');
    expect(canSwap(s.tasks, 2)).toBe(false);
    expect(canSwap(withTasks('A', 'B', 'C', 'D').tasks, 3)).toBe(true);
  });
});

describe('warming up', () => {
  it('touching counts as acting, caps at 3, and set aside removes', () => {
    let s = withTasks('A', 'B', 'C', 'D');
    s = { ...s, opens: [{ at: t0.toISOString() }] };
    const [a, b, c, d] = ids(s, 'A', 'B', 'C', 'D');
    s = touch(s, a, ist('19:05:00'));
    expect(s.opens[0].actedAt).toBe(ist('19:05:00').toISOString());
    s = touch(touch(touch(s, b, t0), c, t0), d, t0);
    expect(touchingNow(s, '2026-10-11')).toEqual([a, b, c]);
    s = setAside(s, b);
    expect(touchingNow(s, '2026-10-11')).toEqual([a, c]);
  });

  it("yesterday's warm-up does not carry over", () => {
    let s = withTasks('A');
    s = touch(s, ids(s, 'A')[0], ist('19:05:00'));
    expect(touchingNow(s, '2026-10-12')).toEqual([]);
  });

  it('done from a card finishes the task and drops the card', () => {
    let s = withTasks('A', 'B');
    const [a] = ids(s, 'A');
    s = finishCard(touch(s, a, t0), a, t0);
    expect(s.tasks.find((t) => t.id === a)!.doneAt).toBeDefined();
    expect(touchingNow(s, '2026-10-11')).toEqual([]);
  });

  it('focus starts the timer, logs the warm-up, and clears it', () => {
    let s = withTasks('Leads', 'Scraping', 'Email');
    const [l, sc] = ids(s, 'Leads', 'Scraping');
    s = touch(touch(s, l, t0), sc, t0);
    s = focusOn(s, sc, ist('19:20:00'));
    expect(activeCycle(s)?.taskId).toBe(sc);
    expect(s.warmup).toBeUndefined();
    expect(s.journal).toEqual([
      expect.objectContaining({ type: 'warmup', text: 'Warmed up on Leads · Scraping → focused on Scraping', cycleId: activeCycle(s)!.id }),
    ]);
  });

  it('focus without a warm-up just starts the timer', () => {
    let s = withTasks('A');
    s = focusOn(s, ids(s, 'A')[0], t0);
    expect(activeCycle(s)).toBeDefined();
    expect(s.journal).toEqual([]);
  });
});
