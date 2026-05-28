# Retrospective — vendor-superpowers-tooling

## Evidence
- Vendored critical-path dependencies as local canonical skills:
  - `c3spec-using-git-worktrees`
  - `c3spec-finishing-development-branch`
- Migrated tier/archive references away from external `superpowers:*` names for critical path
- Updated required canonical skill enforcement lists
- Verification: `pnpm test -s` passed (80 files, 1429 tests)

## What worked
- Scoped vendoring (critical now, broader evaluation later) kept change manageable.
- Explicit direct + nested dependency audit clarified follow-up priorities.

## What did not work
- Dependency graph extraction is still manual and documentation-driven.

## Workflow/process improvements
- Add a reusable dependency-inventory command/script for future vendoring and external-dependency audits.

## Generalizable learning
For external workflow dependency reduction, split work into:
1) immediate critical-path replacement, and
2) ranked adoption roadmap for non-critical capabilities.
This reduces delivery risk while preserving strategic improvement momentum.
