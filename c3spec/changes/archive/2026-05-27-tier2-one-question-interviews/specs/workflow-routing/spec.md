## ADDED Requirements

### Requirement: One-question interview pacing

Interview-driven workflow steps SHALL ask one user-facing interview question per message and SHALL NOT batch multiple questions awaiting answers in the same turn.

#### Scenario: c3spec-start interview pacing

- **WHEN** `c3spec-start` conducts the relentless interview in Step 2
- **THEN** it SHALL ask at most one interview question per message before waiting for the user's answer
- **AND** it SHALL NOT send numbered multi-question dumps in a single message

#### Scenario: Grouped findings with a single question

- **WHEN** `c3spec-start` shares codebase findings, hypotheses, or alignment summaries during the interview
- **THEN** it MAY present those findings together in one message
- **AND** the message SHALL end with exactly one question for the user to answer next

#### Scenario: User provides unprompted answers

- **WHEN** the user answers topics that were not asked yet or provides extra context beyond the current question
- **THEN** the interviewing skill SHALL accept that context without re-asking covered topics
- **AND** SHALL advance the interview based on the new information

#### Scenario: Tier 3 brainstorm discovery pacing

- **WHEN** `c3spec-tier3-full` runs the brainstorm step using the brainstorming skill
- **THEN** clarifying questions during discovery SHALL be asked one per turn
- **AND** the workflow SHALL NOT override the skill with batched numbered question lists

#### Scenario: Tightly coupled clarifications in one turn

- **WHEN** two clarifications are so coupled that splitting them would feel artificial (for example, "soft-block or hard-block — and if soft, what default?")
- **THEN** the workflow MAY ask them in the same turn as a single compound question
- **AND** SHALL still avoid unrelated numbered question batches

#### Scenario: Tier follow-up clarifications after handoff

- **WHEN** a tier workflow needs additional user input after `c3spec-start` handoff
- **THEN** it SHALL ask one clarifying question per turn
- **AND** SHALL NOT restart a full discovery interview or dump multiple numbered questions at once
