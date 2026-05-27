# Plan: one-question-interviews

## Stage 1 — Parallel-safe

### Task 1.1: Delta spec
Write `specs/workflow-routing/spec.md` under the change directory with `## ADDED Requirements` for one-question interview pacing (start, Tier 3 brainstorm, grouped findings, bonus answers, tier follow-ups).

### Task 1.2: Canonical c3spec-start
Add interview pacing subsection to Step 2 and a `What NOT to do` section forbidding numbered question dumps. Mirror to `skills/c3spec-start/SKILL.md`.

## Stage 2 — Sequential

### Task 2.1: Tier skills
Update tier 1–3 canonical skills: Tier 1/2/3 anti-patterns; Tier 3 brainstorm step explicit one-question rule. Mirror legacy `skills/` copies.

### Task 2.2: Main spec + test
Merge delta into `c3spec/specs/workflow-routing/spec.md`. Add vitest that checks canonical skills and main spec contain pacing markers.

### Task 2.3: Host regen + verify
Run `node bin/c3spec.js update` in repo root. Run `pnpm test` and `pnpm exec tsc --noEmit`.

## Stage 3 — Finish

### Task 3.1: Retro and archive
Write `retro.html`, save `retro.md`, run `c3spec archive -y`, remove IDEAS.md #13 entry.
