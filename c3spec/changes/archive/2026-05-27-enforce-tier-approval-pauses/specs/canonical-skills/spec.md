## MODIFIED Requirements

### Requirement: Tier lifecycle skill contract

`c3spec-tier-lifecycle` SHALL define canonical pause, fast-forward, and HTML-handoff semantics that tier and resume skills consume.

#### Scenario: Tier and resume skills consume updated lifecycle policy

- **WHEN** a tier or resume skill is updated for approval behavior
- **THEN** it SHALL reference `c3spec-tier-lifecycle` for pause and handoff semantics
- **AND** it SHALL avoid introducing contradictory local policy

### Requirement: Resume helpers stay aligned with tier workflow contracts

Resume helpers SHALL follow lifecycle-defined gate semantics including non-pausing `tasks.md` and `plan.md`, non-blocking `verify.md` on success, and fast-forward stop-at-retrospective behavior.

#### Scenario: Resume after tasks and plan exist

- **WHEN** a resumed change has completed `tasks.md` and `plan.md`
- **THEN** resume helpers SHALL NOT require a mandatory approval stop solely for those artifacts

#### Scenario: Resume after successful verification

- **WHEN** `verify.md` exists and verification succeeded
- **THEN** resume helpers SHALL proceed to retrospective flow without an extra approval gate

#### Scenario: Resume under fast-forward

- **WHEN** fast-forward is active through retrospective
- **THEN** resume helpers SHALL stop after retrospective before archive
