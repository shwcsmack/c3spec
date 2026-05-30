# Design: subagent-bootstrap-cli

Date: 2026-05-29

## Decisions

| ID | Decision | Reason | Alternatives |
| --- | --- | --- | --- |
| D1 | Add explicit CLI gate `c3spec subagent bootstrap --change <id>`. | Single deterministic pre-dispatch contract reduces skill drift and late failures. | Implicit skill-only checks (rejected for inconsistency). |
| D2 | Validate-only behavior in v1. | Avoid hidden mutations and environment side effects. | Auto-fix bootstrap (deferred). |
| D3 | Require `--change <id>`; derive tier from disk metadata. | Deterministic change scoping with lower flag burden. | Auto-detect active change, require `--tier` (rejected for ambiguity/drift). |
| D4 | Distinct exit codes by failure class + `--json` output. | Reliable automation and testability without parsing human text. | Single non-zero code with free-form text (rejected). |
| D5 | Required checks: `runtime`, `artifacts`, `roles`; `memory` informational. | Strong gating on execution-critical prerequisites without over-blocking. | Make memory required (deferred). |

## Architecture / Flow

```text
subagent dispatch caller (tier/apply/subagent skill)
  -> run: c3spec subagent bootstrap --change <id> [--json]
  -> if exit code == 0: proceed dispatch
  -> else: stop and surface remediation

bootstrap internals:
  resolve change root -> derive tier -> execute checks by category
  -> aggregate results -> print human report or JSON
  -> return exit code by failure class
```

## Command Contract

- `c3spec subagent bootstrap --change <id>` (required `--change`)
- `--json` returns machine-readable results
- Exit 0 only when all required checks pass

### JSON shape (v1)

```json
{
  "ok": false,
  "change": "subagent-bootstrap-cli",
  "tier": 3,
  "checks": [
    {
      "checkId": "runtime.pi-only",
      "category": "runtime",
      "status": "pass|fail|warn",
      "message": "...",
      "required": true
    }
  ],
  "failures": [
    {
      "code": "BOOTSTRAP_RUNTIME_UNSUPPORTED",
      "checkId": "runtime.pi-only",
      "message": "...",
      "nextSteps": ["..."]
    }
  ],
  "nextSteps": ["..."]
}
```

### Exit code classes (proposed)

| Code | Meaning |
| --- | --- |
| 0 | All required checks passed |
| 20 | Runtime prerequisite failure |
| 21 | Change/tier resolution failure (missing/ambiguous metadata) |
| 22 | Required artifact readiness failure |
| 23 | Role dispatch prerequisite failure |
| 24 | CLI usage/argument error |
| 25 | Unexpected internal/bootstrap execution error |

## Check Definitions

- **runtime** (required): pi runtime contract available for named-agent dispatch.
- **artifacts** (required): change exists, tier derivable, and apply-critical artifacts present for derived tier.
- **roles** (required): named roles `implementer`, `spec-reviewer`, `quality-reviewer` are dispatchable via host adapter contract.
- **memory** (informational): memory index/readability and relevant-entry discoverability reported as warn/pass only.

## Integration Points

- `c3spec-subagent-dev`: run bootstrap before any implementer/reviewer dispatch.
- `c3spec-apply-change`: invoke bootstrap prior to handing off to subagent-dev (or ensure subagent-dev enforces gate).
- Tier skills: no direct dispatch bypass of bootstrap gate.
- `c3spec-host-adapter`: align runtime/role expectations used by bootstrap checks.

## Risks and Mitigations

- **False negatives on legacy changes:** return clear tier-resolution error with remediation instead of silent fallback.
- **Contract drift between skills and CLI:** route all dispatch gates through bootstrap; avoid duplicate ad hoc checks.
- **Output contract churn:** lock check IDs and failure codes in tests.

## Rollout

1. Implement command + check engine + JSON/human output.
2. Add unit/integration tests for all failure classes and exit codes.
3. Wire subagent dispatch paths to enforce gate.
4. Update affected specs and skill docs.
