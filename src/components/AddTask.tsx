import { useState } from 'react';

type Props = {
  open: boolean;
  waiting: number;
  onOpen: () => void;
  onClose: () => void;
  onAdd: (title: string) => void;
};

export function AddTask({ open, waiting, onOpen, onClose, onAdd }: Props) {
  const [text, setText] = useState('');
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => {
          setLastAdded(null);
          onOpen();
        }}
        className="rounded-full border border-stone-700 px-5 py-3 text-stone-300 transition hover:border-stone-500"
      >
        + Add task
      </button>
    );
  }

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setLastAdded(t);
    setText('');
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          placeholder="What needs doing?"
          aria-label="New task"
          enterKeyHint="done"
          className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-lg outline-none focus:border-amber-300"
        />
        <button
          type="submit"
          className="rounded-xl bg-amber-300 px-4 font-semibold text-stone-950 disabled:opacity-40"
          disabled={!text.trim()}
        >
          Add
        </button>
        <button type="button" onClick={onClose} className="px-2 text-stone-500" aria-label="Close">
          ✕
        </button>
      </form>
      <p className="h-5 truncate text-sm text-stone-500" role="status">
        {lastAdded ? `Added “${lastAdded}” · ${waiting} waiting` : ''}
      </p>
    </div>
  );
}
