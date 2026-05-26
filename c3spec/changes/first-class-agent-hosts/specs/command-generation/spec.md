## REMOVED Requirements

### Requirement: CommandContent interface

The command-content abstraction is no longer part of the core c3spec workflow generation model. Slash-command generation SHALL NOT be used to set up first-class Cursor, Claude Code, or Codex support.

### Requirement: ToolCommandAdapter interface

The per-tool slash command adapter interface is removed from the core workflow setup/update path.

### Requirement: Command generator function

The command generator function is removed from the core workflow setup/update path.

### Requirement: CommandAdapterRegistry

The command adapter registry is removed from the core workflow setup/update path.

### Requirement: Shared command body content

Shared slash-command body content is no longer generated for first-class c3spec hosts.

## ADDED Requirements

### Requirement: Host generation adapter contract

The system SHALL define a host-generation adapter contract for rendering first-class host artifacts from canonical `.agents/` inputs.

#### Scenario: Host adapter renders native artifacts

- **WHEN** a host adapter is invoked for a supported host
- **THEN** it SHALL render the host's native artifacts from canonical skill, agent, hook, and instruction inputs
- **AND** it SHALL NOT generate slash-command files

#### Scenario: Host adapter capabilities

- **WHEN** implementing a host adapter
- **THEN** the adapter SHALL declare the host ID it supports
- **AND** provide rendering behavior for the host's required artifact types:
  - skills where the host requires a generated mirror
  - subagent definitions
  - hook configuration
  - always-on instruction files
  - project config files

#### Scenario: Unsupported host lookup

- **WHEN** code asks for a host adapter for a removed or unknown host ID
- **THEN** lookup SHALL return no adapter
- **AND** callers SHALL fail with a clear unsupported-host error rather than falling back to partial command generation
