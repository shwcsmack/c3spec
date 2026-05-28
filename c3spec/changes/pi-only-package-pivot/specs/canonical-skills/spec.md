## ADDED Requirements

### Requirement: Pi-native canonical skill execution

Canonical c3spec skills SHALL be authored and validated against pi-native execution assumptions.

#### Scenario: Host adapter behavior
- **WHEN** canonical skills require runtime-specific dispatch guidance
- **THEN** guidance SHALL target pi-native mechanisms only
- **AND** SHALL NOT include Cursor/Claude/Codex-specific dispatch instructions

#### Scenario: Canonical skill validation
- **WHEN** validating canonical skill surfaces
- **THEN** validation SHALL enforce pi-only runtime contract language
