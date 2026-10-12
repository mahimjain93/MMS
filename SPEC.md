# MMS — v1 spec

## The job
On a bad day, get me from opening the app to doing one real thing in under 2 minutes.

Every feature must make that faster or more likely. If it doesn't, it waits.

## Who it's for
Me. One user, one browser. No auth, no sync, no onboarding.

## The loop (the whole of v1)
1. **Check in** — one tap: Battery `Full / Half / Low`, plus an optional mood (Calm · Okay · Anxious · Flat · Restless). Once per day — a day runs **4 AM to 4 AM**, so a session past midnight belongs to the day it started; tap the battery in the header to change either. Mood is recorded (shown in the journal), it does not change which task appears.
2. **Warm up** — the app deals up to **3 cards** (small, same size; a step shows which task it's part of). `On it` = I'm touching this (no timer). A touched card offers `Focus · 25 min` and `✓ Done`. `Swap` sends a card to the back; `Too big` splits it. When one pulls you in, Focus locks in on it and the rest fold away. (Born from how I actually work: 2–3 things in parallel to get going, then one.)
3. **Work cycle** — 25-min timer on the task you focused on. `⚡ JUST START` starts a cycle with no task picked.
4. **How was that?** — neutral prompt after the cycle: tick done / not done, optional one-line note.
5. **Journal** — every cycle and note lands in one dated journal. It also holds the **check-in history**: each day's battery, mood and number of cycles (beside the entries on a laptop, above them on a phone).

Adding a task is always one tap away from any state, so an empty list never dead-ends. Adding confirms it and shows how many are waiting.

**All tasks** (header → Tasks): the queue, oldest first, with steps nested. Rename, add a step (+), mark done, delete. **Done today** lists what's finished, each with Undo (undoing a step also reopens the task it had finished). It's for housekeeping — the main screen still shows one task.

**Routines** (Exercise, Breathwork to start; add/remove via Edit): a small strip above the cards. Not tasks — they reset daily, are never dealt as cards, and are **not tied to battery**. Tap to log (often after the fact), tap again to undo. The Journal's check-in history shows which were done each day.

**Breathwork** (header → Breathe, or ▶ next to the Breathwork routine): full-screen, 3 minutes. A ring to follow — in 4 · hold 2 · out 6 — with a very soft tone at each in/out. Lines from the very first version: "Autopilot detected. Stabilize before acting." → halfway "The wave is peaking. Hold position." → "You created space between impulse and action." Also try: walk, water, stretch, cold water. At the end: "What was pulling at you?" (optional), Done / Another round. Writes a journal line; a minute or more ticks today's Breathwork. Opens over anything, including a running timer.

**Yay**: every Done (card, How was that?, All tasks) plays a short rising sound and a confetti burst with a "Done ✓" pill (no confetti if the device asks for reduced motion). "Not yet" gets nothing — it isn't failing.

**Sound**: a soft tick on Focus / Just start; a chime when a cycle ends — on time (scheduled on the audio clock so it rings in a background tab) or early. In-app sound only.

## "This feels too big"
Splits a task into 2–3 smaller first steps that replace it in the doorway.
- v1 (Prompt 02): manual — I type the steps.
- v1.1 (Prompt 03): Claude API suggests the steps; I edit or accept. Call goes through a Vercel serverless function so the API key never ships to the browser.

## Dealing cards (keep it dumb)
- Cards you're touching stay put, first. Free slots fill in order: oldest undone task first; on Low battery, split-off steps first.
- `Swap` moves a card to the back of the line — it returns when a slot frees up.
- A warm-up belongs to its day; tomorrow starts fresh. Focusing writes a journal line: what you warmed up on, what you chose.

## What v1 does NOT have
XP, levels, streaks (incl. routine streaks), Vault, skins/animation, categories, multiple pages, Supabase, auth, push notifications.

## Carried-over decisions (from YouMS)
Streaks pause, never break · JUST START bypasses any required input · "How was that?" not achievement framing · one unified journal with typed entries · Vault is a permission slip (later).

## Data model (localStorage, key `mms-state`)
```ts
type State = {
  schemaVersion: 5;
  tasks:   { id: string; title: string; parentId?: string; createdAt: string; doneAt?: string }[];
  days:    { date: string; battery: 'full' | 'half' | 'low'; mood?: 'calm' | 'okay' | 'anxious' | 'flat' | 'restless'; at?: string }[];
  cycles:  { id: string; date: string; startedAt: string; endedAt?: string; taskId?: string }[];
  journal: { id: string; date: string; type: 'cycle' | 'note' | 'warmup'; text: string; cycleId?: string }[];
  warmup?: { startedAt: string; touching: string[] };   // cards you're on, today
  routines:   { id: string; title: string; createdAt: string; archivedAt?: string }[];
  routineLog: { routineId: string; date: string; at: string }[];   // one row per routine per day
  opens:   { at: string; actedAt?: string }[];   // the 2-week metric; returning to an open tab after 30+ min (or into a new day) counts as an open
};
```
All reads go through `load()`, which runs migrations by `schemaVersion`. Never `localStorage.clear()` to fix a crash.

## Success test
After 2 weeks of daily use: share of `opens` with an `actedAt` within 2 minutes. Low-battery days counted separately.

## Stack
Vite + React + TypeScript + Tailwind. Single screen, no router. Vercel. Claude Code end to end.

## Milestones
- **Prompt 01** — scaffold, storage + migrations, check-in, add task, doorway, `opens` logging.
- **Prompt 02** — work cycle, JUST START, How was that?, journal view, manual split.
- **Prompt 03** — Claude-assisted split via `/api/split`.
- Then: two weeks of use before anything else.
