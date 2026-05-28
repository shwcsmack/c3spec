## ADDED Requirements

### Requirement: Artifact workflow uses fixed c3spec contract

Artifact workflow commands SHALL operate using c3spec's fixed workflow contract and SHALL NOT require schema resolution from package/project schema directories.

#### Scenario: Change creation without schema flag

- **WHEN** a user creates a new change with default workflow commands
- **THEN** the command SHALL create workflow metadata and artifact paths using built-in c3spec behavior
- **AND** it SHALL NOT require or expose a `--schema` selector for standard operation

#### Scenario: Schema directories are not runtime dependencies

- **WHEN** workflow status/instructions are loaded
- **THEN** the runtime SHALL not resolve templates from `schemas/*` or `c3spec/schemas/*`
- **AND** workflow guidance SHALL come from fixed command/skill logic
