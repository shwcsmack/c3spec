# Canonical Skills Specification - Changes

## MODIFIED Requirements

### Requirement: Required canonical skills are enforced

Host generation and validation SHALL require the tier routing skills, tier lifecycle contract, resumption helpers, and utility skills: `c3spec-start`, `c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full`, `c3spec-tier-lifecycle`, `c3spec-subagent-dev`, `c3spec-host-adapter`, `c3spec-continue-change`, `c3spec-apply-change`, `c3spec-explore`, `c3spec-sync-specs`, `c3spec-archive-change`, `c3spec-bulk-archive-change`, `c3spec-verify-change`, and `c3spec-onboard`.

`c3spec-tier-lifecycle` SHALL exist so that tier skills and resume/apply/archive helpers share the same artifact, pause point, apply readiness, and archive readiness contract.

`c3spec-continue-change` and `c3spec-apply-change` SHALL exist so that an agent can resume a paused tier workflow — either after an explicit stop between artifacts or in a fresh context — without re-running `c3spec-start` from scratch.

#### Scenario: Validation fails when a required skill is missing

- **WHEN** `discoverCanonicalArtifacts` runs and a required skill directory is absent
- **THEN** validation SHALL report a missing required canonical skill error

#### Scenario: Lifecycle skill is bundled

- **WHEN** host generation or workspace skill installation reads bundled canonical skills
- **THEN** `c3spec-tier-lifecycle` SHALL be present alongside the tier routing and resume helper skills
- **AND** installed agents SHALL be able to consult it without using a repo-local-only path

### Requirement: CI checks canonical skill presence

The CI pipeline SHALL run `pnpm check:canonical-skills` to assert every required skill file exists under `.agents/skills/`, including `c3spec-tier-lifecycle`.

#### Scenario: CI passes when all canonical skills exist

- **WHEN** all required `.agents/skills/*/SKILL.md` files are present
- **THEN** `pnpm check:canonical-skills` SHALL exit successfully

## ADDED Requirements

### Requirement: Tier lifecycle skill contract

`c3spec-tier-lifecycle` SHALL be a reference skill, not a user-facing workflow entry point.

#### Scenario: Tier lifecycle skill describes tier artifacts

- **WHEN** an agent reads `c3spec-tier-lifecycle`
- **THEN** it SHALL find the required and optional artifacts for Tier 1, Tier 2, and Tier 3 workflows
- **AND** it SHALL find each tier's folder convention, pause points, apply readiness, and archive readiness

#### Scenario: Tier lifecycle skill supports fresh-context resume

- **WHEN** `c3spec-continue-change` or `c3spec-apply-change` resumes a change from disk
- **THEN** it SHALL consult `c3spec-tier-lifecycle` before deciding the next action
- **AND** it SHALL prefer on-disk lifecycle metadata over chat history

### Requirement: Resume helpers stay aligned with tier workflow contracts

Canonical resume helpers SHALL describe the current tier workflows and SHALL NOT instruct agents to follow retired artifact sequences or bypass tier review discipline.

#### Scenario: Continue helper is tier-aware

- **WHEN** an agent uses `c3spec-continue-change`
- **THEN** the helper SHALL instruct it to identify the change tier from lifecycle metadata
- **AND** it SHALL create at most one artifact or route to the next safe human approval gate

#### Scenario: Apply helper preserves subagent discipline

- **WHEN** an agent uses `c3spec-apply-change` for an implementation-ready change
- **THEN** the helper SHALL instruct it to invoke `c3spec-subagent-dev`
- **AND** it SHALL NOT instruct the agent to mark `tasks.md` checkboxes directly outside the controller/review workflow

### Requirement: Host adapter describes available dispatch surfaces

`c3spec-host-adapter` SHALL describe how each supported host dispatches the canonical agent roles without requiring non-existent generated files.

#### Scenario: Cursor dispatch instructions

- **WHEN** an agent reads `c3spec-host-adapter` while running in Cursor
- **THEN** it SHALL be instructed to dispatch Cursor subagents by role name when the host exposes those roles directly
- **AND** it SHALL NOT require `.cursor/agents/<name>.md` files to exist before dispatching `implementer`, `spec-reviewer`, or `quality-reviewer`
