/**
 * End-of-cycle chime, made with Web Audio (no sound file).
 * The chime is scheduled on the audio clock when a cycle starts, so it still
 * rings on time if the tab is in the background — browsers slow down timers
 * in hidden tabs but not audio.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    ctx = AC ? new AC() : null;
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Call from a tap/click: browsers only allow sound after a user gesture. */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state !== 'running') c.resume().catch(() => {});
}

type Note = { f: number; t: number; len: number; vol: number };

/** Play notes starting at an audio-clock time. Returns a function that silences them. */
function play(c: AudioContext, start: number, notes: Note[]): () => void {
  const nodes: OscillatorNode[] = [];
  for (const n of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = n.f;
    const t = start + n.t;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(n.vol, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + n.len);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + n.len + 0.05);
    nodes.push(osc);
  }
  return () => {
    for (const o of nodes) {
      try {
        o.disconnect(); // silences it straight away
        o.stop();
      } catch {
        // already finished
      }
    }
  };
}

// Two rounds of a rising two-note chime.
const CHIME: Note[] = [
  { f: 659.25, t: 0, len: 1.1, vol: 0.45 },
  { f: 880, t: 0.35, len: 1.1, vol: 0.45 },
  { f: 659.25, t: 1.4, len: 1.1, vol: 0.45 },
  { f: 880, t: 1.75, len: 1.1, vol: 0.45 },
];

// One short, soft note: "started".
const TICK: Note[] = [{ f: 523.25, t: 0, len: 0.35, vol: 0.35 }];

/** Schedule the chime for a wall-clock time. Returns a function that cancels it. */
export function scheduleChime(atMs: number): () => void {
  const c = getCtx();
  if (!c) return () => {};
  return play(c, c.currentTime + Math.max(0, (atMs - Date.now()) / 1000), CHIME);
}

export function playChime(): void {
  const c = getCtx();
  if (c) play(c, c.currentTime + 0.05, CHIME);
}

/** Call from the Start tap: confirms the start and switches sound on for this visit. */
export function playStartTick(): void {
  unlockAudio();
  const c = getCtx();
  if (c) play(c, c.currentTime + 0.05, TICK);
}
