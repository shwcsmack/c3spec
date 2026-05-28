## Purpose

Define command-generation behavior in pi-only c3spec.
## Requirements
### Requirement: Legacy multi-host command-generation removed

c3spec SHALL NOT provide multi-host command-generation adapters in pi-only mode.

#### Scenario: Adapter-based command generation requested
- **WHEN** legacy adapter-based command generation is requested
- **THEN** c3spec SHALL report the capability is removed in pi-only mode
- **AND** users SHALL run c3spec workflows directly in pi.

### Requirement: Remove multi-host generation pipeline from core

Core c3spec workflow execution SHALL NOT depend on host-generation renderers for Cursor, Claude Code, or Codex.

#### Scenario: Core workflow execution
- **WHEN** running core c3spec workflows
- **THEN** execution SHALL proceed without generating host-native artifacts for non-pi hosts

#### Scenario: Legacy host-generation path invoked
- **WHEN** code paths request removed host-generation adapters
- **THEN** c3spec SHALL fail with a clear removed-capability error

