import type { Task } from '../storage';

type Props = {
  task: Task | null;
  canSkip: boolean;
  onStart: () => void;
  onSkip: () => void;
  onAdd: () => void;
};

export function Doorway({ task, canSkip, onStart, onSkip, onAdd }: Props) {
  if (!task) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-xl text-stone-400">Nothing here yet</p>
        <button
          onClick={onAdd}
          className="rounded-2xl bg-amber-300 px-8 py-5 text-xl font-semibold text-stone-950 transition active:scale-[0.98]"
        >
          + Add task
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
      <p className="text-sm uppercase tracking-widest text-stone-500">Just this one</p>
      <h1 className="text-3xl leading-snug font-semibold break-words sm:text-4xl" data-testid="doorway-task">
        {task.title}
      </h1>
      <div className="flex w-full flex-col gap-3">
        <button
          onClick={onStart}
          className="rounded-2xl bg-amber-300 py-5 text-xl font-semibold text-stone-950 transition active:scale-[0.98]"
        >
          Start
        </button>
        {canSkip && (
          <button
            onClick={onSkip}
            className="rounded-2xl border border-stone-700 py-4 text-lg text-stone-300 transition hover:border-stone-500"
          >
            Not this one
          </button>
        )}
        <button
          disabled
          className="rounded-2xl py-3 text-base text-stone-600"
          title="Coming soon"
        >
          This feels too big · coming soon
        </button>
      </div>
    </div>
  );
}
