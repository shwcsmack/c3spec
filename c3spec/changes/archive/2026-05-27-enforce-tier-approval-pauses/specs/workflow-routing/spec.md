## MODIFIED Requirements

### Requirement: Tier lifecycle contract

Tier workflows SHALL treat `c3spec-tier-lifecycle` as the single source of truth for pause gates and HTML-to-markdown handoff sequencing.

#### Scenario: Lifecycle-owned pause policy is consumed by tier skills

- **WHEN** tier workflows define approval pauses
- **THEN** they SHALL consume pause gates from `c3spec-tier-lifecycle`
- **AND** they SHALL NOT redefine contradictory pause rules locally

#### Scenario: Tasks and plan artifacts are non-pausing by default

- **WHEN** `tasks.md` and `plan.md` are written
- **THEN** the workflow MAY continue without a mandatory approval stop
- **AND** any optional review prompt SHALL NOT block progression unless the user requests a stop

#### Scenario: Verification is non-blocking on success

- **WHEN** verification checks pass and `verify.md` is written
- **THEN** the workflow SHALL proceed without requiring an additional approval pause before retrospective

#### Scenario: Verification failure pauses progression

- **WHEN** verification checks fail
- **THEN** the workflow SHALL pause for fixes before retrospective or archive actions

#### Scenario: Tier 3 requires HTML review for proposal, design, and retrospective

- **WHEN** Tier 3 produces proposal, design, or retrospective artifacts
- **THEN** it SHALL generate `proposal.html`, `design.html`, and `retrospective.html`
- **AND** each SHALL be reviewed before the corresponding durable markdown record is finalized

#### Scenario: Tier 1 and Tier 2 HTML companions remain optional

- **WHEN** Tier 1 or Tier 2 generates an optional HTML companion
- **THEN** the workflow SHALL enforce ordered handoff before durable markdown

#### Scenario: HTML review ordering

- **WHEN** an artifact has HTML review enabled
- **THEN** markdown SHALL NOT be saved before review approval
- **AND** markdown SHALL become the durable lifecycle record after approval

#### Scenario: Fast-forward defaults through retrospective then stops before archive

- **WHEN** user requests `fast forward` without narrower scope
- **THEN** workflow SHALL continue through retrospective generation
- **AND** it SHALL stop after retrospective for human review

#### Scenario: Fast-forward honors explicit scope overrides

- **WHEN** user specifies a narrower `fast forward` scope
- **THEN** workflow SHALL honor that scope and resume normal pause behavior after the scoped boundary

#### Scenario: Natural-language affirmative approvals are accepted

- **WHEN** user responds with a clear affirmative in natural language
- **THEN** the gate SHALL be treated as approved
- **AND** workflow SHALL continue to the next lifecycle step
