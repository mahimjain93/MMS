import { useCallback, useEffect, useState } from 'react';
import { useAppState } from './useAppState';
import { addTask, checkIn, dayFor } from './logic/state';
import { candidates } from './logic/pickDoorway';
import { canSwap, dealCards, finishCard, focusOn, setAside, swapCard, touch, touchingNow } from './logic/warmup';
import { activeCycle, addNote, CYCLE_MS, finishCycle, remainingMs, splitTask, startCycle } from './logic/cycles';
import { addStep, deleteTask, markDone, renameTask, undoDone } from './logic/tasks';
import { activeRoutines, addRoutine, doneOn, removeRoutine, toggleRoutine } from './logic/routines';
import { playChime, playStartTick, playYay, scheduleChime, unlockAudio } from './sound';
import { CheckIn } from './components/CheckIn';
import { Warmup } from './components/Warmup';
import { Celebration } from './components/Celebration';
import { Routines } from './components/Routines';
import { AddTask } from './components/AddTask';
import { Timer } from './components/Timer';
import { HowWasThat } from './components/HowWasThat';
import { Split } from './components/Split';
import { Journal } from './components/Journal';
import { TaskList } from './components/TaskList';
import { useTheme } from './theme';
import { BatteryIcon } from './components/BatteryIcon';

export default function App() {
  const [state, setState] = useAppState();
  const [theme, nextTheme] = useTheme();
  const [skipIds, setSkipIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'journal' | 'tasks' | null>(null);
  const [editingCheckIn, setEditingCheckIn] = useState(false);
  // A running cycle is "ending" once its time is up or "End early" is pressed.
  const [endingId, setEndingId] = useState<string | null>(null);
  const [yay, setYay] = useState(0);
  const celebrate = () => {
    playYay();
    setYay(Date.now());
  };

  const today = dayFor(state);
  const battery = today?.battery;
  const cycle = activeCycle(state);
  const cycleTask = cycle?.taskId ? state.tasks.find((t) => t.id === cycle.taskId) : undefined;
  const ending = !!cycle && (endingId === cycle.id || remainingMs(cycle) === 0);
  const touching = touchingNow(state);
  const cards = battery ? dealCards(state.tasks, battery, touching, skipIds) : [];
  const splitting = splittingId ? state.tasks.find((t) => t.id === splittingId) : undefined;
  const endCycle = useCallback(() => {
    if (!cycle) return;
    // Time up: the scheduled chime rings. Ended early: chime now instead.
    if (remainingMs(cycle) > 1000) playChime();
    setEndingId(cycle.id);
  }, [cycle]);
  const waiting = candidates(state.tasks).length;

  // Chime when the running cycle's time is up; cancelled if it ends early.
  const runningId = cycle && !ending ? cycle.id : null;
  useEffect(() => {
    if (!runningId || !cycle) return;
    return scheduleChime(new Date(cycle.startedAt).getTime() + CYCLE_MS);
  }, [runningId]);

  // Browsers only allow sound after a tap; after a reload, any tap re-enables it.
  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio);
    return () => window.removeEventListener('pointerdown', unlockAudio);
  }, []);

  let main;
  if (panel === 'journal') {
    main = <Journal state={state} onNote={(text) => setState((s) => addNote(s, text))} onClose={() => setPanel(null)} />;
  } else if (panel === 'tasks') {
    main = (
      <TaskList
        tasks={state.tasks}
        onRename={(id, title) => setState((s) => renameTask(s, id, title))}
        onAddStep={(id, title) => setState((s) => addStep(s, id, title))}
        onUndo={(id) => setState((s) => undoDone(s, id))}
        onDone={(id) => {
          setState((s) => markDone(s, id));
          celebrate();
        }}
        onDelete={(id) => setState((s) => deleteTask(s, id))}
        onClose={() => setPanel(null)}
      />
    );
  } else if (editingCheckIn && today) {
    main = (
      <CheckIn
        current={today}
        onPick={(b, mood) => {
          setState((s) => checkIn(s, b, mood));
          setEditingCheckIn(false);
          setSkipIds([]);
        }}
        onCancel={() => setEditingCheckIn(false)}
      />
    );
  } else if (cycle && ending) {
    main = (
      <HowWasThat
        title={cycleTask?.title}
        onSave={(answer) => {
          setState((s) => finishCycle(s, answer));
          if (answer.done && cycleTask) celebrate();
          setEndingId(null);
          setSkipIds([]);
        }}
      />
    );
  } else if (cycle) {
    main = <Timer cycle={cycle} title={cycleTask?.title} onEnd={endCycle} />;
  } else if (!battery) {
    main = <CheckIn onPick={(b, mood) => setState((s) => checkIn(s, b, mood))} />;
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
    const routinesDone = doneOn(state);
    main = (
      <div className="flex w-full flex-col items-center gap-10">
        <Routines
          routines={activeRoutines(state)}
          done={routinesDone}
          onToggle={(id) => {
            if (!routinesDone.has(id)) celebrate();
            setState((s) => toggleRoutine(s, id));
          }}
          onAdd={(title) => setState((s) => addRoutine(s, title))}
          onRemove={(id) => setState((s) => removeRoutine(s, id))}
        />
        <Warmup
          cards={cards}
          touching={touching}
          since={touching.length ? state.warmup?.startedAt : undefined}
          parentTitle={(t) => (t.parentId ? state.tasks.find((x) => x.id === t.parentId)?.title : undefined)}
          canSwap={canSwap(state.tasks, cards.length)}
          onTouch={(id) => setState((s) => touch(s, id))}
          onSetAside={(id) => setState((s) => setAside(s, id))}
          onFocus={(id) => {
            playStartTick();
            setState((s) => focusOn(s, id));
            setSkipIds([]);
          }}
          onDone={(id) => {
            setState((s) => finishCard(s, id));
            celebrate();
          }}
          onSwap={(id) => setSkipIds((ids) => swapCard(state.tasks, battery, touching, ids, id))}
          onSplit={(id) => setSplittingId(id)}
          onJustStart={() => {
            playStartTick();
            setState((s) => startCycle(s));
          }}
          onAdd={() => setAdding(true)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 py-6 md:px-8">
      <header className="flex h-8 items-center justify-between gap-3 text-sm text-stone-500">
        <span className="font-semibold tracking-wider text-stone-400">MMS</span>
        <div className="flex items-center gap-3 sm:gap-4">
          {today && (
            <button
              onClick={() => {
                setPanel(null);
                setEditingCheckIn((v) => !v);
              }}
              aria-label={`Battery ${today.battery}${today.mood ? `, mood ${today.mood}` : ''}. Tap to change.`}
              className={`flex items-center gap-1.5 ${editingCheckIn ? 'text-amber-200' : 'text-stone-400 hover:text-stone-200'}`}
            >
              <BatteryIcon level={today.battery} />
              <span>
                {today.battery}
                {today.mood && <span className="text-stone-500"> · {today.mood}</span>}
              </span>
            </button>
          )}
          <button
            onClick={() => {
              setEditingCheckIn(false);
              setPanel(panel === 'tasks' ? null : 'tasks');
            }}
            className={panel === 'tasks' ? 'text-amber-200' : 'text-stone-400 hover:text-stone-200'}
          >
            Tasks{waiting > 0 && ` · ${waiting}`}
          </button>
          <button
            onClick={() => {
              setEditingCheckIn(false);
              setPanel(panel === 'journal' ? null : 'journal');
            }}
            className={panel === 'journal' ? 'text-amber-200' : 'text-stone-400 hover:text-stone-200'}
          >
            Journal
          </button>
          <button
            onClick={nextTheme}
            aria-label={`Theme: ${theme}. Tap to change.`}
            title={`Theme: ${theme}`}
            className="w-6 text-base text-stone-400 hover:text-stone-200"
          >
            {theme === 'light' ? '☀' : theme === 'dark' ? '☾' : '◐'}
          </button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center py-10">{main}</main>
      {yay > 0 && <Celebration key={yay} onDone={() => setYay(0)} />}
      {panel !== 'journal' && !splitting && (
        <footer className="flex justify-center pb-4">
          <AddTask
            open={adding}
            waiting={waiting}
            onOpen={() => setAdding(true)}
            onClose={() => setAdding(false)}
            onAdd={(title) => setState((s) => addTask(s, title))}
          />
        </footer>
      )}
    </div>
  );
}
