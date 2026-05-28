## Purpose

Define pi-only replacement behavior for canonical skill refresh after CLI update removal.

## Requirements

### Requirement: Remote skill refresh managed by pi lifecycle

Because `c3spec update` is removed in pi-only mode, runtime canonical skill refresh SHALL be managed by pi package lifecycle.

#### Scenario: Canonical skill refresh
- **WHEN** users need newer canonical skills
- **THEN** they SHALL use pi package update flows
- **AND** c3spec SHALL NOT expose a dedicated `update` command for remote skill fetching.
