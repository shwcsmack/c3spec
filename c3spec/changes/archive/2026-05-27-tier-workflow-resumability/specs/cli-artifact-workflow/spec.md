# cli-artifact-workflow Specification - Changes

## ADDED Requirements

### Requirement: Tier lifecycle metadata is readable by agents

Workflow artifact commands and skills SHALL preserve enough concrete paths and artifact context for agents to combine schema-backed status with tier lifecycle metadata.

#### Scenario: Status reports schema-backed artifacts

- **WHEN** a user runs `c3spec status --change <id> --json` for a schema-backed change
- **THEN** the output SHALL continue to include schema name, completion state, artifact statuses, planning home, change root, artifact paths, and action context
- **AND** agents SHALL be able to read those paths without assuming a hardcoded change root

#### Scenario: Resume helper combines status with tier metadata

- **WHEN** a change has both schema-backed artifacts and a tier lifecycle metadata file
- **THEN** resume helpers SHALL use status output for artifact existence and lifecycle metadata for tier-specific gates
- **AND** they SHALL NOT treat schema artifact readiness as permission to skip human approval gates

### Requirement: Artifact workflow supports tier helper checks without schema rewrite

The artifact workflow SHALL support tier-aware helpers without requiring every tier to be encoded as a separate schema in this pass.

#### Scenario: Tier 1 has non-schema lifecycle metadata

- **WHEN** a Tier 1 change folder exists with lifecycle metadata but no full schema graph
- **THEN** resume/apply skills SHALL be allowed to use the lifecycle contract rather than forcing the change through the full schema artifact graph
- **AND** CLI schema migration SHALL NOT be required for Tier 1 lightweight fixes

#### Scenario: Schema-backed changes keep existing status behavior

- **WHEN** a Tier 2 or Tier 3 change uses an existing schema-backed artifact graph
- **THEN** existing `status` and `instructions` behavior SHALL remain available
- **AND** lifecycle-aware helpers SHALL treat the CLI output as artifact path/status context, not the entire workflow contract

## MODIFIED Requirements

### Requirement: Apply Instructions Command

The system SHALL generate schema-aware apply instructions via `c3spec instructions apply`, and tier-aware helper skills SHALL use those instructions together with the tier lifecycle contract before starting implementation.

#### Scenario: Generate apply instructions

- **WHEN** user runs `c3spec instructions apply --change <id>`
- **AND** all required artifacts (per schema's `apply.requires`) exist
- **THEN** the system outputs context files, schema-specific instruction text, progress tracking information when available, and the current apply state

#### Scenario: Apply blocked by missing artifacts

- **WHEN** user runs `c3spec instructions apply --change <id>`
- **AND** required artifacts are missing
- **THEN** the system indicates apply is blocked
- **AND** lists which artifacts must be created first

#### Scenario: Tier helper preserves implementation discipline

- **WHEN** a tier-aware helper receives ready apply instructions
- **THEN** it SHALL still check tier lifecycle metadata before starting implementation
- **AND** it SHALL route implementation through the tier's prescribed execution path rather than directly editing tasks when the lifecycle contract requires subagent review
