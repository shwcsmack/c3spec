# Plan: enforce-tier-approval-pauses

## Stage 1 - Contract and consumer alignment

### Task 1.1: Update lifecycle contract

Revise `.agents/skills/c3spec-tier-lifecycle/SKILL.md` to define canonical pause points, ordered HTML handoff behavior, fast-forward defaults/scope, and natural-language approval interpretation.

### Task 1.2: Align tier skill consumers

Update `c3spec-tier1-fix`, `c3spec-tier2-feature`, and `c3spec-tier3-full` so each consumes lifecycle policy without contradictory local pause rules.

### Task 1.3: Align resume helper

Update `c3spec-continue-change` so resumed flows honor non-pausing `tasks.md`/`plan.md`, non-blocking successful `verify.md`, and fast-forward stop-after-retro behavior.

## Stage 2 - Specs, docs, and tests

### Task 2.1: Update delta specs

Maintain delta specs under `c3spec/changes/enforce-tier-approval-pauses/specs/` for `workflow-routing` and `canonical-skills` to capture behavior changes.

### Task 2.2: Update user-facing instructions

Adjust `AGENTS.md` and `CLAUDE.md` to document pause gates, optional vs required HTML review by tier, and fast-forward semantics.

### Task 2.3: Add focused tests

Extend `test/specs/tier-lifecycle-skill-contract.test.ts` and add companion assertions for tier/resume skills to prevent policy drift.

## Stage 3 - Verification and closeout

### Task 3.1: Run targeted tests

Run focused tests for updated skill-contract behavior, capture failures, and resolve issues.

### Task 3.2: Record verification

Write `verify.md` with commands, results, and residual risks.

### Task 3.3: Retrospective gate

Generate retrospective artifacts and stop for review before archive, including memory-capture decision.
