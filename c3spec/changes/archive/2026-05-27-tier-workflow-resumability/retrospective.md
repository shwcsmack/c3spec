# Retrospective: Tier Workflow Resumability

- Change: `tier-workflow-resumability`
- Branch: `feat/tier-workflow-resumability`
- Tier: 3

## Evidence

- Commits on branch cover lifecycle skill creation, tier skill alignment, continue/apply/host-adapter updates, source spec sync, generated host artifacts, focused contract tests, and the verification record.
- Implementation tasks 1.1 through 5.5 are complete in `tasks.md`.
- Verification passed: `pnpm check:canonical-skills`, `pnpm run build`, `pnpm test` (1415 tests), change validation, and source spec validation.
- Host generation passed: `c3spec sync --force .` regenerated tracked artifacts and repeat sync was stable.

## What Worked

- The single lifecycle contract worked well. Adding `c3spec-tier-lifecycle` gave tier, resume, apply, and archive helpers one shared source of truth instead of duplicating artifact rules in each skill.
- The skills-first design kept the change focused. Most behavior landed in canonical skills, preserving CLI compatibility while making workflow behavior more durable.
- Focused contract tests locked the important prose contracts without adding more subprocess-heavy CLI coverage.
- Staged reviews caught real issues before commit: T1 status transitions, T2 pause gates, archive task-progress blocking, and missing tier-skill lifecycle references.

## What Did Not Work

- Initial skill drafts drifted from lifecycle semantics. Tier1, tier2, and archive helper wording needed multiple review passes for status transitions, optional HTML companions, and task-progress blocking.
- Generated artifact tracking is uneven. `c3spec sync` writes the full Claude skill set, but only a subset is force-tracked in git, so drift verification requires sentinel/hash review instead of a simple `git status` view.
- Spec terminology is still mixed in one area. Synced `cli-artifact-workflow` sections now say `c3spec`, while neighboring untouched scenarios still say `openspec`.

## Workflow / Process Improvements

- Keep `c3spec-tier-lifecycle` as the first implementation task for any future tier-workflow change. Treat tier skill edits as consumers of the contract, not co-owners.
- When changing lifecycle semantics, update archive helpers and their tests in the same stage as tier skill edits.
- Document the tracked-vs-ignored generated artifact convention in verification steps so repeat sync stability checks are interpreted correctly.

## Learning

Tier lifecycle behavior should stay centralized in `c3spec-tier-lifecycle`, with tier/resume/apply/archive skills acting as thin orchestrators over on-disk metadata (`tier.md`, required artifacts, status, and task progress) rather than re-deriving rules locally.

This generalizes beyond this change because future tier workflow edits can otherwise reintroduce contradictions between T1/T2/T3 skills, resume helpers, apply handoffs, and archive readiness checks.

Memory capture: `c3spec/memory/workflow/tier-lifecycle-contract-ownership.md`.
