# workflow-routing Specification - Changes

## MODIFIED Requirements

### Requirement: Tier 1 Spec-Aware Fix routing and workflow shape

`c3spec-start` SHALL route changes that are low risk, localized, and free of spec-level contract changes to a Tier 1 Spec-Aware Fix workflow that avoids full proposal/design/tasks/plan ceremony while still producing a lightweight durable change record.

#### Scenario: T1 routing signals

- **WHEN** the change is a bug fix restoring intended behavior, an investigation or debugging session, a config-value tweak with no contract change, a typo, copy change, or minor UI text edit, or a non-breaking dependency upgrade
- **AND** the footprint is low risk, localized, and introduces no new external contracts or spec-level behavior change
- **THEN** `c3spec-start` SHALL classify the change as `T1 Spec-Aware Fix`

#### Scenario: T1 workflow shape

- **WHEN** the user confirms T1 routing
- **THEN** `c3spec-start` SHALL hand off to the `c3spec-tier1-fix` skill
- **AND** the workflow SHALL create a lightweight tier change folder for the fix
- **AND** the workflow SHALL NOT require full proposal, design, tasks, and plan ceremony
- **AND** the workflow SHALL include a mini-plan, spec impact check, micro-retrospective, and memory capture when the learning generalizes

#### Scenario: T1 fresh-context record

- **WHEN** a T1 workflow pauses or completes
- **THEN** its change folder SHALL contain enough durable markdown metadata for a fresh agent to identify the tier, goal, branch, required artifacts, affected specs, and current status
- **AND** HTML review artifacts SHALL NOT be the only durable record of spec impact or retrospective conclusions

### Requirement: Tier 2 Lightweight Feature workflow

`c3spec-start` SHALL route contained new capabilities or extensions of an existing capability that have clear scope, real but limited design decisions, and a 1–2 capability spec footprint to a Tier 2 Lightweight Feature workflow with a compact change directory and explicit lifecycle metadata.

#### Scenario: T2 routing signals

- **WHEN** the change introduces a new capability with clear scope and no major design forks, or extends an existing capability with non-trivial but contained design decisions
- **AND** the spec-level changes affect at most one or two capabilities
- **THEN** `c3spec-start` SHALL classify the change as `T2 Lightweight Feature`

#### Scenario: T2 workflow shape

- **WHEN** the user confirms T2 routing
- **THEN** `c3spec-start` SHALL hand off to the `c3spec-tier2-feature` skill
- **AND** the workflow SHALL produce a compact change directory with lifecycle metadata, proposal, tasks, plan, verification, and retrospective artifacts
- **AND** the workflow SHALL include a design artifact and delta specs when the feature has non-trivial design decisions or spec-level behavior changes
- **AND** the workflow SHALL execute via `c3spec-subagent-dev`, run a lightweight verification pass, write a lightweight retrospective, and archive the change

### Requirement: Tier 3 Full Workflow routing and workflow shape

`c3spec-start` SHALL route changes with significant design uncertainty, architectural reach, breaking or external-contract change, cross-system integration, DB/schema change, or any design that is expensive to undo to a Tier 3 Full Workflow with full planning artifacts and explicit lifecycle metadata.

#### Scenario: T3 routing signals

- **WHEN** the change has significant design uncertainty or unknown territory, refactors or modifies multiple capabilities, changes a breaking or external contract, integrates across systems, alters DB schema, or is otherwise expensive to undo
- **THEN** `c3spec-start` SHALL classify the change as `T3 Full Workflow`

#### Scenario: T3 workflow shape

- **WHEN** the user confirms T3 routing
- **THEN** `c3spec-start` SHALL hand off to the `c3spec-tier3-full` skill
- **AND** the workflow SHALL produce lifecycle metadata, brainstorm, proposal, design, delta specs for each affected capability, tasks, and a staged plan before implementation
- **AND** implementation SHALL run via `c3spec-subagent-dev` followed by a full verification artifact, a retrospective, memory capture when learnings generalize, and archive

## ADDED Requirements

### Requirement: Tier lifecycle contract

Tier workflows SHALL share a single lifecycle contract that defines each tier's change folder convention, required artifacts, optional artifacts, pause points, apply readiness, and archive readiness.

#### Scenario: Tier skills consult lifecycle contract

- **WHEN** a tier skill creates, resumes, verifies, or finishes a tier workflow
- **THEN** it SHALL follow the canonical tier lifecycle contract
- **AND** it SHALL NOT duplicate incompatible artifact rules in tier-specific prose

#### Scenario: Fresh-context resume uses lifecycle metadata

- **WHEN** an agent resumes a paused change from disk
- **THEN** it SHALL read the tier lifecycle metadata before creating artifacts or implementing tasks
- **AND** it SHALL be able to identify the tier and next safe action without relying on prior chat history

#### Scenario: Archive readiness is explicit

- **WHEN** a tier workflow is ready to finish
- **THEN** it SHALL check the required artifacts for that tier before archiving or declaring completion
- **AND** missing required artifacts SHALL be reported as blockers or explicit warnings before archive
