# Plan: Tier 3 Full Workflow Skill

## Stage 1 — Parallel-Safe Skill Drafts

### Task 1.1: Add Canonical Host Skill

Create `.agents/skills/c3spec-tier3-full/SKILL.md` with a full Tier 3 workflow contract: pre-flight commit approval, worktree setup, brainstorm, HTML proposal/design/spec/tasks/plan checkpoints, execution through `c3spec-subagent-dev`, full verification, retrospective, memory capture, archive, finishing branch, and anti-patterns.

Test approach: inspect with the existing host-generation tests after registration is added in Stage 2.

### Task 1.2: Add Bundled Parallel Skill Copy

Create `skills/c3spec-tier3-full/SKILL.md` with matching content so the current dual-skill-surface pattern stays symmetrical until the Sprint 2 audit decides whether root `skills/` should remain.

Test approach: compare content shape with `.agents/skills/c3spec-tier3-full/SKILL.md`; no codegen changes are expected for tier skills.

## Stage 2 — Sequential Routing and Registration

### Task 2.1: Route Tier 3 from `c3spec-start`

Update `.agents/skills/c3spec-start/SKILL.md` and `skills/c3spec-start/SKILL.md` so Step 4 invokes `c3spec-tier3-full` for Tier 3 rather than describing the full flow inline.

Test approach: update assertions that check `c3spec-start` routing instructions so they expect the dedicated Tier 3 skill name.

### Task 2.2: Register Tier 3 in Host Generation

Update `src/core/host-generation/types.ts` so `REQUIRED_CANONICAL_SKILL_NAMES` includes `c3spec-tier3-full`. Update `src/core/host-generation/renderers/instructions.ts` so generated `CLAUDE.md`/agent instructions list Tier 3 with `c3spec-tier3-full` as the entry.

Test approach: init/update host-generation tests should install the new canonical skill for supported hosts.

## Stage 3 — Tests

### Task 3.1: Update Canonical Skill Test Mirrors

Update `CANONICAL_SKILL_NAMES` in `test/core/init.test.ts` and `test/core/update.test.ts` to include `c3spec-tier3-full`.

Test approach: run the focused init/update tests if practical, then the full suite.

## Stage 4 — Verification and Cleanup

### Task 4.1: Verify and Fix Drift

Run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm check:codegen` with the worktree-local `TMPDIR`. Fix any failures. Confirm no unexpected generated-template drift occurs, since Tier skills do not use `scripts/generate-templates.js`.

Test approach: all three verification commands pass.
