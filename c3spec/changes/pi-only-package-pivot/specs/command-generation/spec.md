## ADDED Requirements

### Requirement: Remove multi-host generation pipeline from core

Core c3spec workflow execution SHALL NOT depend on host-generation renderers for Cursor, Claude Code, or Codex.

#### Scenario: Core workflow execution
- **WHEN** running core c3spec workflows
- **THEN** execution SHALL proceed without generating host-native artifacts for non-pi hosts

#### Scenario: Legacy host-generation path invoked
- **WHEN** code paths request removed host-generation adapters
- **THEN** c3spec SHALL fail with a clear removed-capability error
