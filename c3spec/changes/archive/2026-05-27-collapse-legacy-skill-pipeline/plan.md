## Stage 1 — Parallel-safe

### Task 1.1: Migrate canonical skills

Copy utility skills into `.agents/skills/` and extend `REQUIRED_CANONICAL_SKILL_NAMES`.

### Task 1.2: Retire legacy pipeline

Delete root `skills/`, `generate-templates.js`, workflow skill TS; extract command templates.

## Stage 2 — Sequential

### Task 2.1: Refactor runtime

Update workspace skills, profiles, tool detection, shared exports.

### Task 2.2: Tests and specs

Update tests; add `canonical-skills` spec; rewrite `remote-skill-fetch` URLs.

### Task 2.3: Verify and archive

Run `pnpm test`, `tsc`, `build`, `check:canonical-skills`; archive change.
