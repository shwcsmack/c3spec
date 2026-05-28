## ADDED Requirements

### Requirement: Pi-only workflow runtime contract

c3spec SHALL define pi as the sole supported runtime/host model for default workflows.

#### Scenario: Routing instructions reference pi only
- **WHEN** generated/default workflow instructions are rendered
- **THEN** they SHALL reference pi-native execution surfaces
- **AND** they SHALL NOT reference Cursor, Claude Code, or Codex as supported hosts

#### Scenario: Non-pi host request
- **WHEN** a workflow attempts host-specific dispatch for a non-pi host
- **THEN** c3spec SHALL fail with a clear unsupported-runtime message
- **AND** SHALL direct the user to pi as the required runtime
