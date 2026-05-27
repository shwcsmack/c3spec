# CLI Archive Command Specification - Changes

## MODIFIED Requirements

### Requirement: Task Completion Check

The archive command SHALL verify task completion status before archiving to prevent premature archival, while tier workflow skills SHALL perform tier artifact readiness checks before invoking archive.

#### Scenario: Incomplete tasks found

- **WHEN** incomplete tasks are found (marked with `- [ ]`)
- **THEN** display all incomplete tasks to the user
- **AND** prompt for confirmation to continue
- **AND** default to "No" for safety

#### Scenario: All tasks complete

- **WHEN** all tasks are complete OR no tasks.md exists
- **THEN** proceed with task-completion validation without prompting

#### Scenario: Tier workflow checks required artifacts before archive

- **WHEN** a c3spec tier workflow is ready to archive through an agent skill
- **THEN** the skill SHALL check the required artifacts defined by the tier lifecycle contract before invoking the archive command
- **AND** missing required artifacts SHALL be reported before archive is attempted

## ADDED Requirements

### Requirement: Archive readiness is tier-aware at the workflow layer

The c3spec workflow SHALL treat archive readiness as a combination of CLI archive checks and tier lifecycle checks.

#### Scenario: Tier skill invokes archive

- **WHEN** a tier skill or archive helper is about to invoke `c3spec archive`
- **THEN** it SHALL first consult the tier lifecycle contract for required artifacts
- **AND** it SHALL confirm the change has reached the tier's ready-to-archive state

#### Scenario: CLI archive remains backwards compatible

- **WHEN** a user runs `c3spec archive` directly on an existing change
- **THEN** the archive command SHALL preserve existing archive behavior for task checks, spec sync, validation, and moving the change folder
- **AND** it SHALL NOT retroactively require pre-fork or legacy changes to contain tier lifecycle metadata in this pass

#### Scenario: Skill-level readiness failure

- **WHEN** a tier workflow is missing a required artifact such as `tier.md`, `verify.md`, or `retrospective.md`
- **THEN** the skill-level archive readiness check SHALL stop before invoking archive
- **AND** it SHALL report which artifacts must be created before continuing
