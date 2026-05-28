# Plan: pi-only-package-pivot

## Stage 1 - Parallel-safe

### Task 1.1: Finalize pi-only contract artifacts
- Files: `c3spec/changes/pi-only-package-pivot/specs/**/spec.md`, `.agents/skills/c3spec-start/SKILL.md`, `.agents/skills/c3spec-host-adapter/SKILL.md`, `src/core/host-generation/renderers/instructions.ts`
- Work: align routing and canonical skill language to pi-only runtime assumptions.
- Dependencies: none.
- Test approach: targeted spec/contract tests and text assertions.

### Task 1.2: Pi package surface definition
- Files: `package.json`, packaging/docs surfaces, resource directories if needed.
- Work: add/validate pi package manifest and resource inclusion strategy.
- Dependencies: none.
- Test approach: package metadata validation + local install simulation where feasible.

### Task 1.3: Documentation sweep plan
- Files: README/workflow docs/instructions referencing host support.
- Work: remove or rewrite non-pi support messaging.
- Dependencies: none.
- Test approach: grep assertions for removed host references in default docs.

## Stage 2 - Sequential

### Task 2.1: Remove multi-host core runtime paths
- Files: `src/core/host-generation/types.ts`, renderers, adapter lookup, related init/sync/update call sites.
- Work: delete/decommission Cursor/Claude/Codex runtime generation paths and unsupported-host references.
- Dependencies: Stage 1 contract alignment.
- Test approach: compile + targeted unit tests for replaced behavior.

### Task 2.2: Replace test matrix with pi-only contract tests
- Files: host-generation/canonical/routing test suites under `test/core/**`.
- Work: remove obsolete host-matrix expectations and add pi-only assertions.
- Dependencies: Task 2.1.
- Test approach: run updated focused suites.

### Task 2.3: Pi-native capability uplift implementation
- Files: selected workflow/runtime modules and/or extension surfaces.
- Work: implement bounded improvements that exploit pi runtime APIs (tools/events/commands/SDK patterns) consistent with design.
- Dependencies: Tasks 2.1–2.2.
- Test approach: targeted behavior tests + manual smoke workflows.

## Stage 3 - Verification and closure

### Task 3.1: Full verification pass
- Files: `c3spec/changes/pi-only-package-pivot/verify.md`
- Work: run build, test suites, drift checks, and migration-safety checks.
- Dependencies: all implementation tasks complete.
- Test approach: command log with outcomes and residual risk notes.

### Task 3.2: Retrospective and memory
- Files: `c3spec/changes/pi-only-package-pivot/retrospective.html`, `retrospective.md`, optional `c3spec/memory/**`
- Work: document lessons and capture generalizable memory if applicable.
- Dependencies: verification complete.
- Test approach: artifact review + memory index update when needed.
