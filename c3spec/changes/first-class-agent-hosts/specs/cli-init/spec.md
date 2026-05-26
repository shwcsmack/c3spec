## MODIFIED Requirements

### Requirement: AI Tool Configuration

The command SHALL configure exactly the first-class c3spec hosts: Cursor, Claude Code, and Codex. It SHALL create canonical `.agents/` artifacts and render host-specific artifacts for selected hosts.

#### Scenario: Prompting for AI tool selection

- **WHEN** `c3spec init` runs interactively
- **THEN** the searchable multi-select SHALL show only Cursor, Claude Code, and Codex
- **AND** configured hosts SHALL remain pre-selected for refresh

#### Scenario: Selecting tools to configure

- **WHEN** a user selects supported hosts and confirms
- **THEN** c3spec SHALL create or refresh canonical `.agents/` artifacts
- **AND** render host-specific artifacts for the selected hosts
- **AND** SHALL NOT generate slash-command files

#### Scenario: Selecting all tools non-interactively

- **WHEN** a user runs `c3spec init --tools all`
- **THEN** c3spec SHALL select Cursor, Claude Code, and Codex
- **AND** render first-class artifacts for all three hosts

### Requirement: Skill Generation

The command SHALL initialize canonical skills under `.agents/skills/` and generate only the host-specific skill mirrors required by selected hosts.

#### Scenario: Initializing canonical skills

- **WHEN** initialization includes tool configuration
- **THEN** c3spec SHALL create the required canonical skill directories under `.agents/skills/`
- **AND** each canonical `SKILL.md` SHALL contain valid skill frontmatter and instructions

#### Scenario: Claude skill mirror

- **WHEN** Claude Code is selected
- **THEN** c3spec SHALL render `.claude/skills/<skill-name>/SKILL.md` from each canonical skill

#### Scenario: Cursor and Codex do not receive skill mirrors

- **WHEN** Cursor or Codex is selected
- **THEN** c3spec SHALL rely on `.agents/skills/`
- **AND** SHALL NOT create `.cursor/skills/` or `.codex/skills/`

## REMOVED Requirements

### Requirement: Slash Command Generation

The command SHALL NOT generate c3spec slash-command files during initialization.

#### Scenario: Selected supported host

- **WHEN** Cursor, Claude Code, or Codex is selected
- **THEN** c3spec SHALL generate skills, agents, hooks, instructions, and config as appropriate
- **AND** SHALL NOT generate `.cursor/commands/`, `.claude/commands/`, or Codex prompt files
