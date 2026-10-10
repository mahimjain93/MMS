import { useCallback, useState } from 'react';
import { useAppState } from './useAppState';
import { addTask, batteryFor, checkIn } from './logic/state';
import { candidates, pickDoorway, skipNext } from './logic/pickDoorway';
import { activeCycle, addNote, finishCycle, remainingMs, splitTask, startCycle } from './logic/cycles';
import { CheckIn } from './components/CheckIn';
import { Doorway } from './components/Doorway';
import { AddTask } from './components/AddTask';
import { Timer } from './components/Timer';
import { HowWasThat } from './components/HowWasThat';
import { Split } from './components/Split';
import { Journal } from './components/Journal';

export default function App() {
  const [state, setState] = useAppState();
  const [skipIds, setSkipIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  // A running cycle is "ending" once its time is up or "End early" is pressed.
  const [endingId, setEndingId] = useState<string | null>(null);

  const battery = batteryFor(state);
  const cycle = activeCycle(state);
  const cycleTask = cycle?.taskId ? state.tasks.find((t) => t.id === cycle.taskId) : undefined;
  const ending = !!cycle && (endingId === cycle.id || remainingMs(cycle) === 0);
  const doorway = battery ? pickDoorway(state.tasks, battery, skipIds) : null;
  const splitting = splittingId ? state.tasks.find((t) => t.id === splittingId) : undefined;
  const canSkip = candidates(state.tasks).length > 1;
  const endCycle = useCallback(() => cycle && setEndingId(cycle.id), [cycle]);

  let main;
  if (journalOpen) {
    main = (
      <Journal state={state} onNote={(text) => setState((s) => addNote(s, text))} onClose={() => setJournalOpen(false)} />
    );
  } else if (cycle && ending) {
    main = (
      <HowWasThat
        title={cycleTask?.title}
        onSave={(answer) => {
          setState((s) => finishCycle(s, answer));
          setEndingId(null);
          setSkipIds([]);
        }}
      />
    );
  } else if (cycle) {
    main = <Timer cycle={cycle} title={cycleTask?.title} onEnd={endCycle} />;
  } else if (!battery) {
    main = <CheckIn onPick={(b) => setState((s) => checkIn(s, b))} />;
  } else if (splitting) {
    main = (
      <Split
        title={splitting.title}
        onSplit={(steps) => {
          setState((s) => splitTask(s, splitting.id, steps));
          setSplittingId(null);
          setSkipIds([]);
        }}
        onCancel={() => setSplittingId(null)}
      />
    );
  } else {
    main = (
      <Doorway
        task={doorway}
        canSkip={canSkip}
        onStart={() => doorway && setState((s) => startCycle(s, doorway.id))}
        onJustStart={() => setState((s) => startCycle(s))}
        onSkip={() => doorway && setSkipIds((ids) => skipNext(state.tasks, battery, ids, doorway.id))}
        onSplit={() => doorway && setSplittingId(doorway.id)}
        onAdd={() => setAdding(true)}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 py-6">
      <header className="flex h-8 items-center justify-between text-sm text-stone-500">
        <span className="font-semibold tracking-wider text-stone-400">MMS</span>
        <div className="flex items-center gap-4">
          {battery && <span>Battery · {battery}</span>}
          {!journalOpen && (
            <button onClick={() => setJournalOpen(true)} className="text-stone-400 hover:text-stone-200">
              Journal
            </button>
          )}
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center py-10">{main}</main>
      {!journalOpen && !splitting && (
        <footer className="flex justify-center pb-4">
          <AddTask
            open={adding}
            waiting={candidates(state.tasks).length}
            onOpen={() => setAdding(true)}
            onClose={() => setAdding(false)}
            onAdd={(title) => setState((s) => addTask(s, title))}
          />
        </footer>
      )}
    </div>
  );
}
