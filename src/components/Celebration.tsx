import { useEffect, useRef } from 'react';

const COLORS = ['#f59e0b', '#fbbf24', '#10b981', '#38bdf8', '#f472b6', '#a78bfa', '#fb7185'];
const DURATION = 1700;

type Piece = { x: number; y: number; vx: number; vy: number; w: number; h: number; r: number; vr: number; c: string };

/** A short confetti burst plus a "Done" pill. Calls onDone when finished. */
export function Celebration({ onDone }: { onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.current?.getContext('2d');
    if (reduce || !ctx || !canvas.current) {
      const t = setTimeout(onDone, 1200);
      return () => clearTimeout(t);
    }

    const el = canvas.current;
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    el.width = W * dpr;
    el.height = H * dpr;
    ctx.scale(dpr, dpr);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const pieces: Piece[] = [];
    // Two bursts from the lower corners, angled in towards the middle.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 70; i++) {
        pieces.push({
          x: side < 0 ? rand(0, W * 0.1) : rand(W * 0.9, W),
          y: H + 10,
          vx: -side * rand(2, 9),
          vy: -rand(12, 22),
          w: rand(6, 10),
          h: rand(3, 6),
          r: rand(0, Math.PI),
          vr: rand(-0.3, 0.3),
          c: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
    }

    const start = performance.now();
    let raf = 0;
    let last = start;
    const frame = (now: number) => {
      const dt = Math.min(2, (now - last) / 16.7);
      last = now;
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = t > DURATION - 400 ? Math.max(0, (DURATION - t) / 400) : 1;
      for (const p of pieces) {
        p.vy += 0.45 * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t < DURATION) raf = requestAnimationFrame(frame);
      else onDone();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 h-full w-full" />
      <div
        role="status"
        className="pointer-events-none fixed top-16 left-1/2 z-50 animate-[pop_1.6s_ease-out_forwards] rounded-full bg-emerald-700 px-5 py-2 font-semibold text-white shadow-lg"
      >
        Done ✓
      </div>
    </>
  );
}
