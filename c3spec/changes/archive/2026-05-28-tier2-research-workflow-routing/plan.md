# Plan: Research workflow routing

## Stage 1 — Routing and contract definition (sequential)
### Task 1.1: Specify research routing semantics
Update `c3spec/specs/workflow-routing/spec.md` with a new requirement/scenarios for explicit research intent routing, confirmation behavior, and ambiguous-case handling.

### Task 1.2: Update start skill routing logic/documentation
Revise `.agents/skills/c3spec-start/SKILL.md` so interview/routing includes research intent detection and routes to the research workflow instead of T1/T2/T3 when appropriate.

## Stage 2 — New skill surface (sequential)
### Task 2.1: Create `c3spec-research` skill
Author `.agents/skills/c3spec-research/SKILL.md` with lightweight research artifacts, question/scope discipline, findings synthesis, recommendation, and explicit handoff to implementation flows.

### Task 2.2: Register canonical skill references
Update canonical skill registries/validators (starting with `src/core/host-generation/types.ts`) so the new required skill is recognized and host-generated artifacts remain consistent.

## Stage 3 — Enforcement and quality (parallel-safe where possible)
### Task 3.1: Add/adjust routing tests
Add tests for research-intent phrases and expected routing output/confirmation behavior.

### Task 3.2: Add/adjust skill inventory validation tests
Ensure required canonical skill checks include the new research skill.

## Stage 4 — Verification and closeout (sequential)
### Task 4.1: Run verification suite
Run targeted tests first, then full test/typecheck as appropriate; fix failures.

### Task 4.2: Write `verify.md`
Record commands, outcomes, and residual risk.

### Task 4.3: Write retrospective (+ memory decision)
Capture evidence, what worked/what didn’t, and whether a durable memory entry is warranted.
