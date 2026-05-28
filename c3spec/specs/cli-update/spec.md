## Purpose

Define behavior after removal of the `c3spec update` command in pi-only c3spec.

## Requirements

### Requirement: Update command removal

The `c3spec update` command SHALL NOT be available in pi-only c3spec.

#### Scenario: User invokes update
- **WHEN** a user runs `c3spec update`
- **THEN** the CLI SHALL report the command is unavailable
- **AND** users SHALL be directed to pi package lifecycle commands for updates.
