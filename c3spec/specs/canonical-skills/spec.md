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

Host generation and validation SHALL require the tier routing skills plus utility skills: `c3spec-start`, `c3spec-tier1-fix`, `c3spec-tier2-feature`, `c3spec-tier3-full`, `c3spec-subagent-dev`, `c3spec-host-adapter`, `c3spec-explore`, `c3spec-sync-specs`, `c3spec-archive-change`, `c3spec-bulk-archive-change`, `c3spec-verify-change`, and `c3spec-onboard`.

#### Scenario: Validation fails when a required skill is missing

- **WHEN** `discoverCanonicalArtifacts` runs and a required skill directory is absent
- **THEN** validation SHALL report a missing required canonical skill error

### Requirement: CI checks canonical skill presence

The CI pipeline SHALL run `pnpm check:canonical-skills` to assert every required skill file exists under `.agents/skills/`.

#### Scenario: CI passes when all canonical skills exist

- **WHEN** all required `.agents/skills/*/SKILL.md` files are present
- **THEN** `pnpm check:canonical-skills` SHALL exit successfully

### Requirement: Workspace installs copy bundled canonical skills

Workspace skill installation SHALL copy `SKILL.md` content from the bundled `.agents/skills/` package directory for profile-selected utility workflows, not from generated TypeScript templates.

#### Scenario: Core profile workspace install

- **WHEN** workspace setup installs skills for the core profile
- **THEN** it SHALL write `c3spec-explore`, `c3spec-sync-specs`, and `c3spec-archive-change` from bundled canonical sources

