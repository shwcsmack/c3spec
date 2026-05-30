## Purpose

Define behavior after removal of the `c3spec init` command in pi-only c3spec.

## Requirements

### Requirement: [CLI-INIT-001] Init command removal

The `c3spec init` command SHALL NOT be available in pi-only c3spec.

#### Scenario: User invokes init
- **WHEN** a user runs `c3spec init`
- **THEN** the CLI SHALL report the command is unavailable
- **AND** users SHALL be directed to manage package lifecycle through pi (`pi install`, `pi update`, `pi remove`).
