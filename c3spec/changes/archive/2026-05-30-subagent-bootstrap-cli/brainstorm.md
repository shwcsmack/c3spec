# Brainstorm: subagent-bootstrap-cli

## Problem framing

Subagent-driven implementation currently depends on implicit setup assumptions spread across skills (`c3spec-subagent-dev`, `c3spec-host-adapter`, tier/apply flows). Failures often occur late (during dispatch) rather than at a deterministic preflight gate. This causes brittle execution and unclear remediation.

## Why now

Idea #10 is top-priority and blocks reliable workflow execution. Stabilizing dispatch preconditions is required to make Tier 1/2/3 implementation and review agents dependable.

## Scope

- Add a new explicit command: `c3spec subagent bootstrap --change <id>`
- Validate-only behavior in v1 (no automatic mutation/fixing)
- Strict non-zero failure on required prerequisite failures
- Add `--json` machine-readable output with stable shape
- Define named check categories and per-check IDs
- Add distinct exit codes by failure class
- Integrate command into subagent dispatch paths as a hard gate

## Non-goals

- Auto-fix/install/bootstrap mutations in v1
- Removing existing subagent skills or changing role names
- Broad rearchitecture of all tier workflows beyond bootstrap gating integration

## Decisions locked from interview

1. Use Tier 3 workflow.
2. Choose Option B: explicit bootstrap CLI.
3. Command name: `c3spec subagent bootstrap`.
4. Default behavior: validate-only.
5. Required failures produce strict non-zero exit.
6. Include `--json` output in v1.
7. Require `--change <id>` in v1.
8. Derive tier from disk metadata; fail on ambiguity.
9. Use distinct exit codes by failure class.
10. Required checks in v1: `runtime`, `artifacts`, `roles`.
11. `memory` check is informational (non-blocking) in v1.

## Candidate check model

- `runtime` (required): verify supported runtime contract for subagent dispatch.
- `artifacts` (required): validate apply-ready artifacts for derived tier + change context needed by dispatch.
- `roles` (required): verify required role mappings/primitives for `implementer`, `spec-reviewer`, `quality-reviewer`.
- `memory` (informational): report memory index/context availability expected by subagent prompts.

Each check emits:
- stable `checkId`
- `category`
- `status` (`pass` | `fail` | `warn`)
- summary and remediation guidance

## Risks and unknowns

- Runtime detection may be host-sensitive and must avoid false failures.
- Existing skills may duplicate checks unless bootstrap gating is centralized.
- Exit code taxonomy must be stable and documented to avoid downstream breakage.
- Tier derivation edge cases (legacy/pre-fork changes without `tier.md`) need explicit behavior.

## Recommended direction

Implement `c3spec subagent bootstrap --change <id>` as the single pre-dispatch validator and update subagent entry paths to require a successful bootstrap result before dispatch. Keep v1 conservative (validate-only), machine-readable (`--json`), and automation-friendly (distinct exit codes + check IDs).