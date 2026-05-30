# Proposal: subagent-bootstrap-cli

Date: 2026-05-29

## Why

Subagent-driven execution in c3spec currently depends on implicit prerequisites spread across skills. Failures appear late at dispatch time, causing brittle workflows and unclear remediation. We need a deterministic, explicit pre-dispatch gate.

## What Changes

| Area | Before | After |
| --- | --- | --- |
| Bootstrap contract | Implicit checks in multiple skills | Explicit command: `c3spec subagent bootstrap --change <id>` |
| Behavior | Mixed/late failure points | Validate-only, strict gating, deterministic failures |
| Output | Mostly human-oriented guidance | Human output + `--json` machine-readable mode |
| Automation semantics | Single generic failure behavior | Distinct exit codes by failure class |

## New Capabilities

- New subcommand: `c3spec subagent bootstrap --change <id>` (required `--change` in v1).
- Tier derivation from on-disk metadata; hard-fail on ambiguity.
- Check categories with stable IDs: required `runtime`, `artifacts`, `roles`; informational `memory`.
- Strict non-zero exits for required failures; distinct exit codes by failure class.
- Stable JSON contract for automation: top-level status + check/failure details + next steps.
- Subagent dispatch paths updated to require successful bootstrap before dispatch.

## Impact

- **Affected specs:** workflow-routing, canonical-skills, cli-artifact-workflow.
- **Affected skills:** c3spec-subagent-dev, c3spec-host-adapter, c3spec-apply-change, and tier skills that dispatch subagents.
- **CLI/API:** adds new user-facing command and JSON contract.
- **Tests:** add command tests for success/failure classes, exit codes, JSON schema, and integration gating from subagent entry paths.
- **Risk:** over-gating legacy/ambiguous changes; mitigated via clear diagnostics and explicit remediation output.
