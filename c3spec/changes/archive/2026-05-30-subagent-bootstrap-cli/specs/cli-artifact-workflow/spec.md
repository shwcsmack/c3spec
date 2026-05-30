## ADDED Requirements

### Requirement: Subagent bootstrap CLI command

The CLI SHALL provide a validate-only bootstrap command for subagent dispatch readiness.

#### Scenario: Bootstrap command requires change identifier
- **WHEN** a user runs `c3spec subagent bootstrap`
- **THEN** the command SHALL require `--change <id>`
- **AND** it SHALL exit non-zero with usage guidance when `--change` is missing

#### Scenario: Tier is derived from disk metadata
- **WHEN** bootstrap runs for a change
- **THEN** it SHALL derive tier from on-disk change metadata
- **AND** it SHALL fail with a dedicated failure class when tier cannot be derived unambiguously

#### Scenario: Validate-only behavior
- **WHEN** bootstrap runs
- **THEN** it SHALL validate prerequisites without mutating user/project state
- **AND** it SHALL output actionable remediation for failed checks

#### Scenario: Required and informational check categories
- **WHEN** bootstrap evaluates dispatch readiness
- **THEN** it SHALL run required checks for `runtime`, `artifacts`, and `roles`
- **AND** it SHALL run `memory` as informational (non-blocking)

#### Scenario: Strict gating exit semantics
- **WHEN** any required check fails
- **THEN** bootstrap SHALL exit non-zero
- **AND** it SHALL use a distinct exit code for each failure class
- **AND** it SHALL exit `0` only when all required checks pass

#### Scenario: JSON output contract
- **WHEN** bootstrap is run with `--json`
- **THEN** it SHALL emit machine-readable output including top-level pass/fail status, check results with stable IDs/categories, failure details, and next-step guidance
