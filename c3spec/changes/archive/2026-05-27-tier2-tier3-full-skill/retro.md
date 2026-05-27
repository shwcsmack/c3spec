# Retrospective: Tier 3 Full Workflow Skill

## Evidence

| Area | Result |
| --- | --- |
| Tasks | 6 / 6 complete in `tasks.md` |
| Verification | `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm check:codegen` passed with worktree-local `TMPDIR` |
| Main changes | New `c3spec-tier3-full` skill in `.agents/skills/` and `skills/`; Tier 3 route updated in `c3spec-start`; host-generation skill list and tests updated |
| Diff shape | Scoped to skill content, host-generation routing, tests, and Tier 2 planning artifacts |

## What Worked

- The c3spec planning flow caught a wrong assumption before implementation: Tier skills do not use the legacy template codegen path.
- Keeping the Tier 3 skill content explicit made the final routing change very small: `c3spec-start` now delegates instead of describing the whole flow inline.
- The existing init/update tests already had a clear canonical skill list pattern, so adding Tier 3 fit the existing structure.

## What Did Not Work

- The first proposal/design draft incorrectly assumed the root `skills/` directory fed all skill types through `scripts/generate-templates.js`. Reading the code corrected the plan before implementation.
- `pnpm` needed a worktree-local `TMPDIR` because the default temp directory referenced a missing path in this shell environment.

## Learning

Generalizable learning: c3spec currently has two different skill pipelines. Legacy workflow skills under root `skills/` feed template codegen, while first-class tier/host skills are registered through `.agents/skills/` and `REQUIRED_CANONICAL_SKILL_NAMES`.

This should be captured as memory because future workflow changes can easily target the wrong pipeline.
