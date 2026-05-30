## ADDED Requirements

### Requirement: Subagent bootstrap gate before dispatch

Tier/apply workflows that dispatch subagents SHALL run `c3spec subagent bootstrap --change <id>` and SHALL stop when required bootstrap checks fail.

#### Scenario: Dispatch proceeds only after bootstrap success
- **WHEN** a workflow is about to dispatch `implementer`, `spec-reviewer`, or `quality-reviewer`
- **THEN** it SHALL execute `c3spec subagent bootstrap --change <id>` first
- **AND** subagent dispatch SHALL proceed only if bootstrap exits `0`

#### Scenario: Required bootstrap failure blocks dispatch
- **WHEN** bootstrap reports a required failure category (`runtime`, `artifacts`, or `roles`)
- **THEN** the workflow SHALL halt subagent dispatch
- **AND** it SHALL surface the bootstrap remediation output to the user
- **AND** it SHALL NOT bypass the gate with a "continue anyway" path

#### Scenario: Memory warnings do not block dispatch
- **WHEN** bootstrap reports only informational `memory` warnings and no required failures
- **THEN** bootstrap SHALL still be considered passing for dispatch gating
- **AND** workflows MAY continue while still surfacing warning context
