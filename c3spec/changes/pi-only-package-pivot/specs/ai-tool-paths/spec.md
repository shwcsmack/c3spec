## ADDED Requirements

### Requirement: Pi-only tool/runtime selection

c3spec SHALL expose pi as the only supported runtime selection for core workflows.

#### Scenario: Runtime selection prompt
- **WHEN** runtime/tool selection is presented
- **THEN** only pi SHALL be presented as supported for default c3spec workflows

#### Scenario: Legacy runtime IDs
- **WHEN** legacy runtime IDs for Cursor, Claude Code, or Codex are provided
- **THEN** c3spec SHALL reject them with explicit migration guidance to pi
