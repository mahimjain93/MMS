import { useEffect, useState } from 'react';
import { load, save, todayStr, type State } from './storage';
import { recordOpen } from './logic/state';
import { activeCycle, remainingMs } from './logic/cycles';

/** Coming back after this long counts as opening the app again. */
export const RESUME_AFTER_MS = 30 * 60 * 1000;

/**
 * Loads once (recording the open), saves on every change, and notices when an
 * open tab is returned to — after the computer sleeps, the tab sits in the
 * background, or the day rolls over. A return after 30+ minutes, or into a new
 * day, counts as a fresh open (unless a timer is still running), and the screen
 * re-checks the date so a new day asks for check-in.
 */
export function useAppState() {
  // The initializer is pure, so React's dev double-call can't log two opens.
  const [state, setState] = useState<State>(() => recordOpen(load()));
  const [, setTick] = useState(0);

  useEffect(() => {
    save(state);
  }, [state]);

  useEffect(() => {
    let lastSeen = Date.now(); // last moment the tab was visible and running
    let day = todayStr();

    const check = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      const away = now - lastSeen;
      lastSeen = now;
      const today = todayStr(new Date(now));
      if (away >= RESUME_AFTER_MS || today !== day) {
        day = today;
        setState((s) => {
          const c = activeCycle(s);
          return c && remainingMs(c) > 0 ? s : recordOpen(s);
        });
      }
      setTick((t) => t + 1); // re-render so "today" is re-read
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') lastSeen = Date.now();
      else check();
    };

    // The interval stops while the computer sleeps, so the first tick after
    // waking sees the gap.
    const id = setInterval(check, 60 * 1000);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', check);
      window.removeEventListener('pageshow', check);
    };
  }, []);

  return [state, setState] as const;
}
