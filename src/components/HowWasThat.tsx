import { useState } from 'react';

type Props = { title?: string; onSave: (answer: { done: boolean; note: string }) => void };

export function HowWasThat({ title, onSave }: Props) {
  const [done, setDone] = useState<boolean | null>(null);
  const [note, setNote] = useState('');

  return (
    <form
      className="flex w-full max-w-lg flex-col items-center gap-6 text-center"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ done: done === true, note });
      }}
    >
      <h1 className="text-3xl font-semibold">How was that?</h1>

      {title && (
        <div className="flex w-full flex-col gap-3">
          <p className="break-words text-stone-400">{title}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: true, label: 'Done' },
              { v: false, label: 'Not yet' },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={done === o.v}
                onClick={() => setDone(o.v)}
                className={`rounded-2xl border py-4 text-lg transition ${
                  done === o.v ? 'border-amber-300 bg-amber-300/10 text-amber-200' : 'border-stone-700 text-stone-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={title ? 'Anything to note? (optional)' : 'What did you work on? (optional)'}
        aria-label="Note"
        className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-lg outline-none focus:border-amber-300"
      />

      <button
        type="submit"
        className="w-full rounded-2xl bg-amber-300 py-4 text-xl font-semibold text-stone-950 transition active:scale-[0.98]"
      >
        Save
      </button>
    </form>
  );
}
