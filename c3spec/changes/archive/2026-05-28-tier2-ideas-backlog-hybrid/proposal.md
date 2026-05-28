# Proposal: Hybrid backlog management (skill capture + CLI authority)

## Why

`IDEAS.md` updates are currently manual and inconsistent. We need low-friction capture during active workflows plus deterministic maintenance operations.

## What changes

- Add `c3spec ideas` CLI command group for deterministic backlog operations.
- Add `c3spec-add-idea` capture skill for non-disruptive idea intake.
- Update canonical skill registry and c3spec-start routing note to include backlog capture path.
- Add tests for ideas command behavior.

## Scope

- `src/commands/ideas.ts`
- `src/cli/program.ts`
- `.agents/skills/c3spec-add-idea/SKILL.md`
- `.agents/skills/c3spec-start/SKILL.md`
- `src/core/host-generation/types.ts`
- `scripts/check-canonical-skills.js`
- `test/commands/ideas.test.ts`
