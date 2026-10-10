import { useState } from 'react';

type Props = { open: boolean; onOpen: () => void; onClose: () => void; onAdd: (title: string) => void };

export function AddTask({ open, onOpen, onClose, onAdd }: Props) {
  const [text, setText] = useState('');

  if (!open) {
    return (
      <button
        onClick={onOpen}
        className="rounded-full border border-stone-700 px-5 py-3 text-stone-300 transition hover:border-stone-500"
      >
        + Add task
      </button>
    );
  }

  const submit = () => {
    if (text.trim()) onAdd(text);
    setText('');
  };

  return (
    <form
      className="flex w-full max-w-md gap-2"
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
        className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-lg outline-none focus:border-amber-300"
      />
      <button type="button" onClick={onClose} className="px-3 text-stone-500" aria-label="Close">
        ✕
      </button>
    </form>
  );
}
