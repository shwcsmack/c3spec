# Remote Skill Fetch Specification

## Purpose

Allow `c3spec update` to refresh canonical agent skills from the GitHub repository at runtime while preserving offline fallback behavior.

## Requirements

### Requirement: Fetch canonical skills from GitHub on update

When `c3spec update` refreshes canonical skills with remote fetch enabled, the command SHALL attempt to fetch each required canonical skill from the c3spec GitHub repository before writing `.agents/skills/` in the user's project.

#### Scenario: Fetch URL construction

- **WHEN** fetching the skill `c3spec-explore`
- **THEN** the URL used SHALL be `https://raw.githubusercontent.com/shwcsmack/c3spec/main/.agents/skills/c3spec-explore/SKILL.md`

#### Scenario: Network failure falls back to bundled content

- **WHEN** remote fetch fails for a canonical skill
- **THEN** the update SHALL complete using bundled `.agents/skills/` content from the installed package
- **AND** a dim warning MAY be displayed
- **AND** no error exit code SHALL be emitted solely due to fetch failure

#### Scenario: All fetches in parallel

- **WHEN** `c3spec update` fetches multiple canonical skills
- **THEN** fetches SHALL run concurrently
