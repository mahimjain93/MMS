# MMS — notes for Claude Code

Read `SPEC.md` before any change. It is the scope boundary.

## Rules
- Don't add anything listed under "What v1 does NOT have" in SPEC.md, even if it seems small. Flag it instead.
- One screen. No router until SPEC.md says otherwise.
- All state goes through `src/storage.ts` (`load`, `save`, `migrate`). Components never touch localStorage directly.
- Any change to the `State` shape bumps `schemaVersion` and adds a migration step. Never clear storage as a fix.
- Clear every interval/timeout in effect cleanups.
- Dates as local `YYYY-MM-DD` strings via one `todayStr()` helper; timestamps as ISO strings.
- Keep components small and in `src/components/`. Logic that decides what to show lives in `src/logic/`, not in components, so it can be tested.
- Plain, calm UI: dark background, one focal element per state, large tap targets, works at phone width.

## Owner
Mahim — not a developer. Explain decisions in plain language in the summary at the end of each task, and list anything you were unsure about.
