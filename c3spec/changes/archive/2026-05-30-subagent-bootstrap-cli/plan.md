# Plan: subagent-bootstrap-cli

Use `c3spec-subagent-dev` to execute this plan task-by-task. The controller owns `tasks.md` checkboxes and only marks them complete after implementation plus spec/quality review.

## Stage 1 — Sequential foundation

### Task 1.1: Locate and map CLI command registration surfaces
- Identify command tree files responsible for top-level and nested command registration.
- Confirm existing patterns for adding subcommands with required flags and JSON mode.
- Output: concrete file list and insertion points for `subagent bootstrap`.
- Validation: no behavior change yet; discovery-only commit-ready diff optional.

### Task 1.2: Define bootstrap domain model and exit-code taxonomy
- Introduce internal types/constants for check categories, check results, failure records, and exit-code classes.
- Ensure constants map to design decisions (runtime, tier-resolution, artifacts, roles, usage, internal).
- Output: shared module(s) that command implementation and tests consume.
- Validation: unit tests for mapping integrity and uniqueness of codes/IDs.

## Stage 2 — Core command implementation (parallel-safe where files do not overlap)

### Task 2.1: Add `c3spec subagent bootstrap` command registration and arg parsing
- Register command path and enforce required `--change <id>`.
- Add `--json` support and route to command handler.
- Ensure missing/invalid arg paths return usage-class failure semantics.
- Files: command registry and command handler entry points.
- Validation: command parsing tests (success + missing arg failure class).

### Task 2.2: Implement change resolution and tier derivation
- Resolve change root from `--change`.
- Derive tier from `tier.md` and lifecycle-compatible fallback rules; fail on ambiguity.
- Return structured failure payloads with remediation guidance.
- Files: bootstrap resolver module(s).
- Validation: resolver unit tests for T1/T2/T3, missing metadata, ambiguous cases.

### Task 2.3: Implement required `runtime` and `roles` checks
- Encode pi runtime contract check.
- Validate role prerequisites for `implementer`, `spec-reviewer`, `quality-reviewer` against host-adapter expectations.
- Emit stable check IDs and failure classes.
- Files: bootstrap checks modules + any shared host detection utilities.
- Validation: unit tests for pass/fail cases with deterministic failure codes.

### Task 2.4: Implement required `artifacts` check
- Validate apply-critical artifacts by derived tier using lifecycle contract rules.
- Include missing-artifact remediation per tier.
- Files: artifact readiness checker module(s).
- Validation: tests covering per-tier artifact requirements and missing-file failures.

### Task 2.5: Implement informational `memory` check
- Verify memory index readability and report warning/pass status.
- Ensure warning-only memory issues do not fail required gate outcome.
- Files: memory-check module(s).
- Validation: tests for readable/missing memory index behavior and non-blocking semantics.

## Stage 3 — Output and exit behavior (sequential integration)

### Task 3.1: Implement human-readable bootstrap report
- Group results by category with clear pass/fail/warn output.
- Include remediation/next-steps section on failures.
- Files: bootstrap formatter module(s).
- Validation: snapshot or string-assert tests for representative outputs.

### Task 3.2: Implement stable JSON output contract
- Output top-level status/context + checks/failures/nextSteps as designed.
- Guarantee stable field names and required fields for automation.
- Files: JSON formatter/serializer.
- Validation: contract tests asserting exact required keys and check ID/category stability.

### Task 3.3: Wire strict exit semantics
- Ensure required failures map to distinct non-zero exit codes.
- Ensure informational-only warnings return exit code 0.
- Ensure unexpected exceptions map to internal error class.
- Files: command handler orchestration.
- Validation: command-level tests asserting process exit codes for each class.

## Stage 4 — Dispatch-path integration

### Task 4.1: Integrate bootstrap gate into subagent dispatch flow
- Run bootstrap before any implementer/reviewer dispatch in subagent-dev flow.
- Abort dispatch and surface remediation on failure.
- Files: relevant skill/command orchestration surfaces for subagent dispatch.
- Validation: integration tests proving halt-on-failure and proceed-on-success.

### Task 4.2: Ensure apply/tier handoff cannot bypass bootstrap
- Confirm apply path dispatches through gated flow or invokes bootstrap directly.
- Remove/adjust any bypass logic.
- Files: apply and tier orchestration surfaces as needed.
- Validation: integration coverage for apply-triggered dispatch path.

## Stage 5 — Spec and skill alignment

### Task 5.1: Update canonical skill docs for bootstrap gate contract
- Update c3spec-subagent-dev and related canonical skill instructions to reference bootstrap gate explicitly.
- Preserve lifecycle and checkbox ownership contracts.
- Validation: targeted text tests or assertions for required wording where such tests exist.

### Task 5.2: Align host adapter wording with bootstrap checks
- Ensure host-adapter runtime/role phrasing matches implemented bootstrap logic.
- Validation: host-adapter spec/contract tests pass.

## Stage 6 — Verification and completion

### Task 6.1: Run targeted test suites for bootstrap command and integrations
- Execute command/unit/integration tests added in this change.
- Capture outputs for verify artifact.

### Task 6.2: Run full repository test suite
- Execute full `pnpm test`.
- Resolve regressions before proceeding.

### Task 6.3: Prepare verification and retrospective artifacts
- Write `verify.md` with commands, outcomes, and residual risks.
- Draft retrospective artifacts and memory decision.

### Task 6.4: Archive readiness and finishing steps
- Confirm lifecycle checklist completion, task checkboxes complete, and spec-sync decision.
- Run archive and branch-finishing flow.
