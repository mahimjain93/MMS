# Prompt 01 — scaffold, storage, check-in, doorway

Paste this into Claude Code from the root of the MMS repo.

---

Read SPEC.md and CLAUDE.md first. Build Milestone "Prompt 01" only.

1. **Scaffold** a Vite + React + TypeScript app with Tailwind in this repo. Keep the existing SPEC.md, CLAUDE.md and prompts/ folder.

2. **Storage** — `src/storage.ts`:
   - The `State` type exactly as in SPEC.md.
   - `load()` reads `mms-state`, returns a fresh default if missing or unparseable, and runs `migrate()` based on `schemaVersion`.
   - `save(state)` writes it back.
   - `todayStr()` returns local date as `YYYY-MM-DD`.
   - A small `useAppState()` hook that loads once and saves on every change.

3. **Opens** — on app load, push `{ at: now }` to `opens`. Export a function `markActed()` that sets `actedAt` on the latest open if not already set. (Prompt 02 will call it when a cycle starts; for now call it from `Start`.)

4. **Check-in** — if there's no `days` entry for today, show only three large buttons: Full / Half / Low. Tapping one saves it and moves on. No other UI on this screen except "+ Add task".

5. **Doorway** — `src/logic/pickDoorway.ts`: pure function `(tasks, battery, skipIds) => task | null` implementing "Doorway selection" from SPEC.md. Show the picked task large and centred with:
   - `Start` — for now: calls `markActed()` and shows "Started: <task>" (the timer comes in Prompt 02).
   - `Not this one` — adds it to an in-memory skip list and picks again; when everything's skipped, reset the list.
   - `This feels too big` — disabled, labelled "coming soon".
   - If there are no undone tasks: show "Nothing here yet" with a large `+ Add task`.

6. **Add task** — always visible as a small button; opens a single text input; Enter saves.

7. **Tests** — add Vitest and unit-test `pickDoorway` (low battery prefers split tasks; oldest first otherwise; null when empty) and `migrate` (bad JSON → default state).

8. Run the tests and the build. Fix anything failing.

Don't add anything not listed above. At the end, give me a plain-language summary: what you built, how to run it locally, and anything you weren't sure about.
