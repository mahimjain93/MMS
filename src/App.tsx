import { useState } from 'react';
import { useAppState } from './useAppState';
import { addTask, batteryFor, checkIn, markActed } from './logic/state';
import { candidates, pickDoorway, skipNext } from './logic/pickDoorway';
import { CheckIn } from './components/CheckIn';
import { Doorway } from './components/Doorway';
import { AddTask } from './components/AddTask';
import type { Task } from './storage';

export default function App() {
  const [state, setState] = useAppState();
  const [skipIds, setSkipIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [started, setStarted] = useState<Task | null>(null);

  const battery = batteryFor(state);
  const doorway = battery ? pickDoorway(state.tasks, battery, skipIds) : null;
  const canSkip = candidates(state.tasks).length > 1;

  let main;
  if (!battery) {
    main = <CheckIn onPick={(b) => setState((s) => checkIn(s, b))} />;
  } else if (started) {
    main = (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-sm uppercase tracking-widest text-stone-500">Started</p>
        <h1 className="text-3xl font-semibold break-words">{started.title}</h1>
        <p className="text-stone-500">The timer arrives in the next build.</p>
        <button onClick={() => setStarted(null)} className="text-stone-400 underline underline-offset-4">
          Back
        </button>
      </div>
    );
  } else {
    main = (
      <Doorway
        task={doorway}
        canSkip={canSkip}
        onStart={() => {
          setState((s) => markActed(s));
          setStarted(doorway);
        }}
        onSkip={() => doorway && setSkipIds((ids) => skipNext(state.tasks, battery, ids, doorway.id))}
        onAdd={() => setAdding(true)}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 py-6">
      <header className="flex h-8 items-center justify-between text-sm text-stone-500">
        <span className="font-semibold tracking-wider text-stone-400">MMS</span>
        {battery && <span>Battery · {battery}</span>}
      </header>
      <main className="flex flex-1 items-center justify-center py-10">{main}</main>
      <footer className="flex justify-center pb-4">
        <AddTask
          open={adding}
          onOpen={() => setAdding(true)}
          onClose={() => setAdding(false)}
          onAdd={(title) => setState((s) => addTask(s, title))}
        />
      </footer>
    </div>
  );
}
