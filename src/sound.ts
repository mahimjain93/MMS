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

/** Schedule the chime for a wall-clock time. Returns a function that cancels it. */
export function scheduleChime(atMs: number): () => void {
  const c = getCtx();
  if (!c) return () => {};
  const start = c.currentTime + Math.max(0, (atMs - Date.now()) / 1000);
  const nodes: OscillatorNode[] = [];

  // Two soft rounds of a rising two-note chime.
  const notes = [
    { f: 659.25, t: 0 },
    { f: 880, t: 0.35 },
    { f: 659.25, t: 1.4 },
    { f: 880, t: 1.75 },
  ];
  for (const n of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = n.f;
    const t = start + n.t;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 1.2);
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
