# Delta: Canonical Skills

## ADDED Requirements

### Requirement: Workspace installs copy bundled canonical skills

Workspace skill installation SHALL copy `SKILL.md` content from the bundled `.agents/skills/` package directory for profile-selected utility workflows, not from generated TypeScript templates.

#### Scenario: Core profile workspace install

- **WHEN** workspace setup installs skills for the core profile
- **THEN** it SHALL write `c3spec-explore`, `c3spec-sync-specs`, and `c3spec-archive-change` from bundled canonical sources
