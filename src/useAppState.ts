import { useEffect, useState } from 'react';
import { load, save, type State } from './storage';
import { recordOpen } from './logic/state';

/** Loads once (recording the open), saves on every change. */
export function useAppState() {
  // The initializer is pure, so React's dev double-call can't log two opens.
  const [state, setState] = useState<State>(() => recordOpen(load()));

  useEffect(() => {
    save(state);
  }, [state]);

  return [state, setState] as const;
}
