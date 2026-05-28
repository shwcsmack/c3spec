## Purpose

Define command-generation behavior in pi-only c3spec.

## Requirements

### Requirement: Legacy multi-host command-generation removed

c3spec SHALL NOT provide multi-host command-generation adapters in pi-only mode.

#### Scenario: Adapter-based command generation requested
- **WHEN** legacy adapter-based command generation is requested
- **THEN** c3spec SHALL report the capability is removed in pi-only mode
- **AND** users SHALL run c3spec workflows directly in pi.
