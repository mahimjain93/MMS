import { useState } from 'react';
import type { Battery, Day, Mood } from '../storage';

const BATTERY: { value: Battery; label: string; hint: string }[] = [
  { value: 'full', label: 'Full', hint: 'Ready to go' },
  { value: 'half', label: 'Half', hint: 'Getting by' },
  { value: 'low', label: 'Low', hint: 'Running on fumes' },
];

export const MOODS: { value: Mood; label: string }[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'okay', label: 'Okay' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'flat', label: 'Flat' },
  { value: 'restless', label: 'Restless' },
];

export const moodLabel = (m?: Mood) => MOODS.find((x) => x.value === m)?.label;

type Props = {
  /** Today's check-in when editing; undefined on the first check-in of the day. */
  current?: Day;
  onPick: (battery: Battery, mood?: Mood) => void;
  onCancel?: () => void;
};

export function CheckIn({ current, onPick, onCancel }: Props) {
  const [mood, setMood] = useState<Mood | undefined>(current?.mood);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        <h2 className="text-base text-stone-400">Mood <span className="text-stone-600">· optional</span></h2>
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Mood">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={mood === m.value}
              onClick={() => setMood((cur) => (cur === m.value ? undefined : m.value))}
              className={`rounded-full border px-4 py-2 transition ${
                mood === m.value
                  ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                  : 'border-stone-700 text-stone-300 hover:border-stone-500'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        <h1 className="text-xl text-stone-400">How's the battery?</h1>
        <div className="flex w-full flex-col gap-3">
          {BATTERY.map((o) => (
            <button
              key={o.value}
              onClick={() => onPick(o.value, mood)}
              aria-pressed={current?.battery === o.value}
              className={`flex items-baseline justify-between rounded-2xl border bg-stone-900 px-6 py-5 text-left transition hover:border-stone-500 active:scale-[0.99] ${
                current?.battery === o.value ? 'border-amber-300' : 'border-stone-700'
              }`}
            >
              <span className="text-2xl font-medium">{o.label}</span>
              <span className="text-sm text-stone-500">{o.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {onCancel && (
        <button onClick={onCancel} className="text-stone-400 underline underline-offset-4">
          Cancel
        </button>
      )}
    </div>
  );
}
