# Tier 2: runcli-in-process-invocation

- Tier: 2
- Slug: runcli-in-process-invocation
- Branch: feat/runcli-in-process-invocation
- Goal: Refactor test/helpers/run-cli.ts to run the CLI in-process by default, keep a subprocess fallback for true bin smoke checks, and reduce/remove timeout inflation once overhead is eliminated.
- Status: ready-to-archive

## Required Artifacts

- [x] tier.md
- [x] proposal.md
- [x] tasks.md
- [x] plan.md
- [x] verify.md
- [x] retrospective.md

## Affected Specs

- workspace-lifecycle | none
- change-workflow | none

## Progress

(Task progress for this T2 lives in `tasks.md` after Step 5. The controller / `c3spec-subagent-dev` owns those checkboxes.)
