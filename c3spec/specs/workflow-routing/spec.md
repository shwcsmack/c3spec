# workflow-routing Specification

## Purpose

The workflow-routing capability SHALL define the c3spec development workflow entry point, tier classifier, tier handoff contracts, canonical skill and review-agent surfaces, generated host instruction alignment, and enforcement boundaries.
## Requirements
### Requirement: Single front door for development work

All c3spec development work SHALL enter through the `c3spec-start` skill, and `c3spec-start` SHALL complete the clean source tree gate and project memory scan before any routing or tier handoff.

#### Scenario: Entering a c3spec workflow

- **WHEN** a user asks an assistant to start any c3spec-driven work (bug fix, feature, refactor, investigation, or change)
- **THEN** the assistant SHALL invoke `c3spec-start` before doing implementation, design, or tier-specific work
- **AND** the assistant SHALL NOT select a tier on the user's behalf without first running the `c3spec-start` interview

#### Scenario: Clean source tree gate runs first

- **GIVEN** the source repo where the workflow is starting
- **WHEN** `c3spec-start` begins
- **THEN** it SHALL run a tracked-changes check equivalent to `git status --porcelain --untracked-files=no` before the interview, routing, or tier handoff
- **AND** if any tracked changes are reported, it SHALL stop and offer exactly three choices: stash and continue, commit first, or abort
- **AND** it SHALL NOT offer a "continue anyway" option that bypasses the gate

#### Scenario: Memory scan runs before routing

- **WHEN** `c3spec-start` passes the clean source tree gate
- **THEN** it SHALL load the project memory index at `c3spec/memory/MEMORY.md` before asking interview questions
- **AND** relevant memory entries SHALL be surfaced naturally during the interview and carried forward into the tier handoff

### Requirement: Three-tier routing classifier

The `c3spec-start` routing classifier SHALL produce exactly one of three outcomes — T1 Spec-Aware Fix, T2 Lightweight Feature, or T3 Full Workflow — and SHALL require explicit user confirmation before handing off to the chosen tier.

#### Scenario: Supported routing outcomes

- **WHEN** the interview converges and `c3spec-start` classifies the change
- **THEN** the classification SHALL be exactly one of `T1 Spec-Aware Fix`, `T2 Lightweight Feature`, or `T3 Full Workflow`
- **AND** the assistant SHALL NOT introduce other tier names, hybrid tiers, or skip routing entirely

#### Scenario: Ambiguous cases lean lighter

- **WHEN** the change could plausibly fit two adjacent tiers
- **THEN** `c3spec-start` SHALL prefer the lighter tier (T1 over T2, T2 over T3)
- **AND** SHALL state the lean explicitly so the user can override before confirmation

#### Scenario: Explicit confirmation required before handoff

- **WHEN** `c3spec-start` presents its tier classification
- **THEN** it SHALL wait for explicit user confirmation (a "yes" or equivalent acknowledgement) before invoking any tier skill
- **AND** SHALL accept a user override of the proposed tier without debate
- **AND** SHALL NOT begin tier-specific work (worktree setup, plan generation, change scaffolding, or implementation) before confirmation

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

### Requirement: Canonical skill and review-agent surfaces

The workflow-routing contract SHALL include local c3spec-owned replacements for critical external superpowers dependencies used by tier/archive workflows.

#### Scenario: Tier workflows invoke local vendored workspace skill

- **WHEN** a tier workflow performs worktree setup
- **THEN** it SHALL invoke `c3spec-using-git-worktrees`
- **AND** it SHALL NOT require external `superpowers:using-git-worktrees` availability for critical-path execution

#### Scenario: Archive and tier endgame invoke local vendored finish skill

- **WHEN** tier or archive flow performs branch finalization
- **THEN** it SHALL invoke `c3spec-finishing-development-branch`
- **AND** it SHALL NOT require external `superpowers:finishing-a-development-branch` availability for critical-path execution

### Requirement: Subagent workflow expectations

Tier workflows SHALL dispatch the canonical agent roles with bounded responsibilities and SHALL keep `tasks.md` checkbox state under controller ownership.

#### Scenario: Bounded implementer scope

- **WHEN** a tier workflow dispatches an `implementer` agent
- **THEN** the agent SHALL receive a single bounded task with the context needed to act
- **AND** the agent SHALL NOT mark `tasks.md` checkboxes on its own

#### Scenario: Two-stage review per task

- **WHEN** an `implementer` reports a task complete
- **THEN** the workflow SHALL run a `spec-reviewer` check before a `quality-reviewer` check
- **AND** the workflow SHALL only consider the task complete after both reviews pass
- **AND** if a reviewer surfaces issues, the workflow SHALL re-dispatch implementation and re-review before progressing

#### Scenario: Controller owns checkbox state

- **WHEN** a task in `tasks.md` is completed under the two-stage review
- **THEN** only the controlling skill (e.g. `c3spec-subagent-dev` or the tier skill) SHALL mark `[ ] → [x]` after both reviews pass
- **AND** implementer or reviewer agents SHALL NOT edit `tasks.md` checkbox state directly

### Requirement: Generated host instruction alignment

Generated host instruction surfaces for Cursor, Claude Code, and Codex SHALL describe the same routing contract: a single `c3spec-start` front door, the same three tiers, and `.agents/` as the canonical source of truth for generated host artifacts.

#### Scenario: Front-door reference in generated instructions

- **WHEN** c3spec generates host instruction content for Cursor, Claude Code, or Codex
- **THEN** the generated instructions SHALL direct users to enter all development work through the `c3spec-start` skill
- **AND** SHALL NOT instruct users to pick a tier themselves before running `c3spec-start`

#### Scenario: Tier list parity across hosts

- **WHEN** generated host instructions describe routing options
- **THEN** they SHALL list exactly the three supported tiers — `T1 Spec-Aware Fix`, `T2 Lightweight Feature`, and `T3 Full Workflow`
- **AND** the tier descriptions SHALL stay consistent across the Cursor, Claude Code, and Codex outputs

#### Scenario: Canonical source disclosure

- **WHEN** generated host instructions describe where canonical skills and hook sources live
- **THEN** they SHALL identify `.agents/` as the canonical source
- **AND** SHALL indicate that generated host artifacts are derived from `.agents/` and protected against drift by c3spec sentinels

### Requirement: Enforcement boundaries for the routing contract

c3spec machine enforcement SHALL guarantee that the canonical skill, agent, and hook surfaces required by the routing contract exist, and SHALL guarantee that source-of-truth specs remain structurally normalized at the current project-wide validation level; per-requirement backing-test enforcement SHALL NOT be introduced by this contract.

#### Scenario: Canonical artifact presence is enforced

- **WHEN** c3spec validates or generates host artifacts
- **THEN** the required canonical skill names (`c3spec-start`, `c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full`, `c3spec-tier-lifecycle`, `c3spec-subagent-dev`, `c3spec-host-adapter`, `c3spec-continue-change`, `c3spec-apply-change`, `c3spec-explore`, `c3spec-sync-specs`, `c3spec-archive-change`, `c3spec-bulk-archive-change`, `c3spec-verify-change`, `c3spec-onboard`, `c3spec-using-git-worktrees`, `c3spec-finishing-development-branch`) SHALL be required to exist under `.agents/skills/`
- **AND** the required canonical agent role names (`implementer`, `spec-reviewer`, `quality-reviewer`) SHALL be required to exist under `.agents/agents/`
- **AND** the required canonical hook name (`c3spec-memory-scan`) SHALL be required to exist under `.agents/hooks/`

#### Scenario: Source-of-truth spec normalization is enforced

- **WHEN** c3spec validates source-of-truth specs under `c3spec/specs/`
- **THEN** each spec file SHALL be required to include explicit `## Purpose` and `## Requirements` sections
- **AND** visible `### Requirement:` headers SHALL remain parseable as structured requirements
- **AND** delta-only headers (`## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, `## RENAMED Requirements`) SHALL be rejected outside of `c3spec/changes/`

#### Scenario: Requirement-to-test enforcement is out of scope

- **WHEN** authoring or modifying this routing contract
- **THEN** the contract SHALL NOT introduce a per-requirement backing-test enforcement mechanism
- **AND** project-wide requirement-to-test coverage SHALL remain deferred to the entry tracked as IDEAS.md #15

### Requirement: One-question interview pacing and recommendation-led turn format

Interview-driven workflow steps SHALL ask exactly one user-facing interview question per message and SHALL NOT batch or compound multiple questions in the same turn. Every interview question turn SHALL include `Recommendation:`, `Why this question now:`, and then exactly one question.

#### Scenario: c3spec-start interview pacing

- **WHEN** `c3spec-start` conducts the relentless interview in Step 2
- **THEN** it SHALL ask at most one interview question per message before waiting for the user's answer
- **AND** it SHALL NOT send numbered multi-question dumps in a single message

#### Scenario: Grouped findings with a single formatted question

- **WHEN** `c3spec-start` shares codebase findings, hypotheses, or alignment summaries during the interview
- **THEN** it MAY present those findings together in one message
- **AND** the message SHALL include `Recommendation:` and `Why this question now:` before asking exactly one question for the user to answer next

#### Scenario: User provides unprompted answers

- **WHEN** the user answers topics that were not asked yet or provides extra context beyond the current question
- **THEN** the interviewing skill SHALL accept that context without re-asking covered topics
- **AND** SHALL advance the interview based on the new information

#### Scenario: Tier 3 brainstorm discovery pacing

- **WHEN** `c3spec-tier3-full` runs the brainstorm step using the brainstorming skill
- **THEN** clarifying questions during discovery SHALL be asked exactly one per turn
- **AND** each question turn SHALL include `Recommendation:` and `Why this question now:` before the question
- **AND** the workflow SHALL NOT override the skill with numbered, batched, or compound question lists

#### Scenario: Tier follow-up clarifications after handoff

- **WHEN** a tier workflow needs additional user input after `c3spec-start` handoff
- **THEN** it SHALL ask exactly one clarifying question per turn
- **AND** each question turn SHALL include `Recommendation:` and `Why this question now:` before the question
- **AND** SHALL NOT restart a full discovery interview or dump multiple numbered, batched, or compound questions at once

#### Scenario: Question mode flexibility

- **WHEN** an interview step selects question format
- **THEN** it MAY use open-ended, multiple-choice, or yes/no questions when warranted
- **AND** all modes SHALL still include the required `Recommendation:` and `Why this question now:` lines

