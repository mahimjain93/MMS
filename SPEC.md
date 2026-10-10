# MMS — v1 spec

## The job
On a bad day, get me from opening the app to doing one real thing in under 2 minutes.

Every feature must make that faster or more likely. If it doesn't, it waits.

## Who it's for
Me. One user, one browser. No auth, no sync, no onboarding.

## The loop (the whole of v1)
1. **Check in** — one tap: Battery `Full / Half / Low`. Once per day; skipped if already done today.
2. **Doorway** — the app shows **one** task, not a list. Buttons: `Start`, `Not this one` (shows next), `This feels too big`.
3. **Work cycle** — 25-min timer on the chosen task. `⚡ JUST START` starts a cycle with no task picked.
4. **How was that?** — neutral prompt after the cycle: tick done / not done, optional one-line note.
5. **Journal** — every cycle and note lands in one dated journal.

Adding a task is always one tap away from any state, so an empty list never dead-ends. Adding confirms it and shows how many are waiting.

**All tasks** (header → Tasks): the queue, oldest first, with split steps nested. Rename, mark done, delete. It's for housekeeping — the main screen still shows one task.

**Sound**: a soft tick on Start; a chime when a cycle ends — on time (scheduled on the audio clock so it rings in a background tab) or early. In-app sound only.

## "This feels too big"
Splits a task into 2–3 smaller first steps that replace it in the doorway.
- v1 (Prompt 02): manual — I type the steps.
- v1.1 (Prompt 03): Claude API suggests the steps; I edit or accept. Call goes through a Vercel serverless function so the API key never ships to the browser.

## Doorway selection (keep it dumb)
- Low battery → prefer the smallest step (a task that came from a split), else the oldest undone task.
- Half / Full → oldest undone task.
- "Not this one" cycles through without reordering anything.

## What v1 does NOT have
XP, levels, streaks, Vault, skins/animation, categories, multiple pages, Supabase, auth, push notifications.

## Carried-over decisions (from YouMS)
Streaks pause, never break · JUST START bypasses any required input · "How was that?" not achievement framing · one unified journal with typed entries · Vault is a permission slip (later).

## Data model (localStorage, key `mms-state`)
```ts
type State = {
  schemaVersion: 1;
  tasks:   { id: string; title: string; parentId?: string; createdAt: string; doneAt?: string }[];
  days:    { date: string; battery: 'full' | 'half' | 'low' }[];
  cycles:  { id: string; date: string; startedAt: string; endedAt?: string; taskId?: string }[];
  journal: { id: string; date: string; type: 'cycle' | 'note'; text: string; cycleId?: string }[];
  opens:   { at: string; actedAt?: string }[];   // the 2-week metric
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
