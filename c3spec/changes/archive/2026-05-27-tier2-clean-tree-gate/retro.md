# Retrospective: Clean Tree Gate

## Evidence

- Changed tracked files before archive: 14
- Diff size before archive: 233 insertions, 11 deletions
- Tasks completed: 8 / 8
- Verification passed:
  - `pnpm run check:codegen`
  - `pnpm exec tsc --noEmit`
  - `pnpm test`

## What Worked

- The first pass added the core guard cleanly to the canonical `.agents/skills/` workflow entry points.
- Reviewers caught real workflow drift: root `skills/` duplicates and generated routing docs would have kept teaching the old order.
- The final verification path passed: `pnpm run check:codegen`, `pnpm exec tsc --noEmit`, and `pnpm test`.

## What Didn't

- The original task list was too narrow; it missed the legacy root skill pipeline and generated instruction source.
- Host sync produced noisy sentinel source-path churn because generated metadata still uses absolute worktree paths.

## Learning

Workflow skill changes must consider both current skill pipelines until idea #10 retires the legacy root `skills/` path. A change that only updates `.agents/skills/` can still leave legacy codegen and generated instructions teaching stale behavior.
