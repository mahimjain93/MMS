import type { Battery } from '../storage';

const OPTIONS: { value: Battery; label: string; hint: string }[] = [
  { value: 'full', label: 'Full', hint: 'Ready to go' },
  { value: 'half', label: 'Half', hint: 'Getting by' },
  { value: 'low', label: 'Low', hint: 'Running on fumes' },
];

export function CheckIn({ onPick }: { onPick: (b: Battery) => void }) {
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <h1 className="text-xl text-stone-400">How's the battery?</h1>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => onPick(o.value)}
            className="flex items-baseline justify-between rounded-2xl border border-stone-700 bg-stone-900 px-6 py-5 text-left transition hover:border-stone-500 active:scale-[0.99]"
          >
            <span className="text-2xl font-medium">{o.label}</span>
            <span className="text-sm text-stone-500">{o.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
