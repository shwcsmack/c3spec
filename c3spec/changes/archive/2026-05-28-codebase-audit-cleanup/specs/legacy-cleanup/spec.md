## ADDED Requirements

### Requirement: Full-repository cleanup audits use risk-banded classification

When performing full codebase cleanup investigations, the workflow SHALL classify candidates into risk bands and require explicit approval for high-risk removals.

#### Scenario: Producing a cleanup plan from a full-repo audit

- **WHEN** an audit identifies removable or questionable repository surfaces
- **THEN** the resulting plan SHALL classify each candidate as Band A, Band B, or Band C
- **AND** SHALL include keep/remove rationale and validation expectations per candidate

#### Scenario: Handling high-risk cleanup candidates

- **WHEN** a candidate is classified as Band C (runtime-facing or highly coupled)
- **THEN** deletion SHALL NOT proceed without explicit user approval for that item
- **AND** the plan SHALL require dedicated validation before and after removal
