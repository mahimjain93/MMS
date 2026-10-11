import { useState } from 'react';

type Props = { title: string; onSplit: (steps: string[]) => void; onCancel: () => void };

export function Split({ title, onSplit, onCancel }: Props) {
  const [steps, setSteps] = useState(['', '', '']);
  const ready = steps.some((s) => s.trim());

  return (
    <form
      className="flex w-full max-w-lg flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSplit(steps);
      }}
    >
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-stone-500">Make it smaller</p>
        <h1 className="mt-2 text-2xl font-semibold break-words">{title}</h1>
        <p className="mt-2 text-stone-400">What's the first tiny step? Add up to three.</p>
      </div>
      {steps.map((s, i) => (
        <input
          key={i}
          autoFocus={i === 0}
          value={s}
          onChange={(e) => setSteps((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
          placeholder={i === 0 ? 'First step, e.g. open the draft' : `Step ${i + 1} (optional)`}
          aria-label={`Step ${i + 1}`}
          className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-lg outline-none focus:border-amber-300"
        />
      ))}
      <button
        type="submit"
        disabled={!ready}
        className="rounded-2xl bg-amber-300 py-4 text-xl font-semibold text-stone-950 transition active:scale-[0.98] disabled:opacity-40"
      >
        Split it
      </button>
      <button type="button" onClick={onCancel} className="text-stone-400 underline underline-offset-4">
        Never mind
      </button>
    </form>
  );
}
