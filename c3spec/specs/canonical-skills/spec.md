# Canonical Skills Specification

## Purpose

Define `.agents/skills/` as the single source of truth for c3spec agent skills and how bundled installs validate them.
## Requirements
### Requirement: Canonical skills live under `.agents/skills/`

The repository SHALL maintain one `SKILL.md` per canonical skill under `.agents/skills/<name>/`. These files SHALL be the authoritative skill content for host generation, npm package bundling, and workspace utility installs.

#### Scenario: Canonical directory layout

- **WHEN** a developer inspects the repository
- **THEN** each required canonical skill SHALL exist as `.agents/skills/<skill-name>/SKILL.md`
- **AND** skill frontmatter `name` SHALL match the directory name

#### Scenario: No root skills pipeline

- **WHEN** a developer looks for a root `skills/` directory or `scripts/generate-templates.js` codegen step
- **THEN** those legacy surfaces SHALL NOT exist
- **AND** `node build.js` SHALL compile TypeScript without regenerating skill templates from markdown

### Requirement: Required canonical skills are enforced

Host generation and validation SHALL require the tier routing skills, tier lifecycle contract, resumption helpers, utility skills, and local replacements for critical superpowers dependencies: `c3spec-using-git-worktrees` and `c3spec-finishing-development-branch`.

#### Scenario: Validation fails when vendored critical skill is missing

- **WHEN** `discoverCanonicalArtifacts` runs and `c3spec-using-git-worktrees` or `c3spec-finishing-development-branch` is absent
- **THEN** validation SHALL report a missing required canonical skill error
- **AND** host artifacts SHALL NOT be generated as fully valid

### Requirement: CI checks canonical skill presence

The CI pipeline SHALL run `pnpm check:canonical-skills` to assert every required skill file exists under `.agents/skills/`, including `c3spec-tier-lifecycle`.

#### Scenario: CI passes when all canonical skills exist

- **WHEN** all required `.agents/skills/*/SKILL.md` files are present
- **THEN** `pnpm check:canonical-skills` SHALL exit successfully

### Requirement: Workspace installs copy bundled canonical skills

Workspace skill installation SHALL copy `SKILL.md` content from the bundled `.agents/skills/` package directory for profile-selected utility workflows, not from generated TypeScript templates.

#### Scenario: Core profile workspace install

- **WHEN** workspace setup installs skills for the core profile
- **THEN** it SHALL write `c3spec-explore`, `c3spec-sync-specs`, and `c3spec-archive-change` from bundled canonical sources

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

### Requirement: Host adapter describes available dispatch surfaces

`c3spec-host-adapter` SHALL describe how each supported host dispatches the canonical agent roles without requiring non-existent generated files.

#### Scenario: Pi dispatch instructions

- **WHEN** an agent reads `c3spec-host-adapter` while running in pi
- **THEN** it SHALL be instructed to dispatch pi role workflows by role name through pi-native mechanisms
- **AND** it SHALL NOT require `.cursor/agents/<name>.md` files to exist before dispatching `implementer`, `spec-reviewer`, or `quality-reviewer`

### Requirement: Pi-native canonical skill execution

Canonical c3spec skills SHALL be authored and validated against pi-native execution assumptions.

#### Scenario: Host adapter behavior
- **WHEN** canonical skills require runtime-specific dispatch guidance
- **THEN** guidance SHALL target pi-native mechanisms only
- **AND** SHALL NOT include Cursor/Claude/Codex-specific dispatch instructions

#### Scenario: Canonical skill validation
- **WHEN** validating canonical skill surfaces
- **THEN** validation SHALL enforce pi-only runtime contract language

