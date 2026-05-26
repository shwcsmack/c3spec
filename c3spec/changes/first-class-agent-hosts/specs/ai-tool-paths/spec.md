## MODIFIED Requirements

### Requirement: Path configuration for supported tools

The `AI_TOOLS` array SHALL include only first-class hosts that c3spec actively supports: Cursor, Claude Code, and Codex. Removed tools SHALL NOT appear in interactive or non-interactive tool selection until they are deliberately reintroduced with first-class skill, subagent, hook, and instruction support.

#### Scenario: Supported tool list is limited to first-class hosts

- **WHEN** the system reads `AI_TOOLS`
- **THEN** the available tool IDs SHALL be exactly `cursor`, `claude`, and `codex`
- **AND** no removed tool IDs SHALL be displayed in init prompts
- **AND** `--tools all` SHALL select only `cursor`, `claude`, and `codex`

#### Scenario: Removed tool is requested non-interactively

- **WHEN** a user runs `c3spec init --tools gemini`
- **THEN** initialization SHALL fail with an invalid tool error
- **AND** the available values SHALL list only `all`, `none`, `cursor`, `claude`, and `codex`

### Requirement: Canonical skill path for Cursor and Codex

Cursor and Codex SHALL consume canonical skills from `.agents/skills/`. c3spec SHALL NOT generate `.cursor/skills/` or `.codex/skills/` as part of first-class host generation.

#### Scenario: Cursor skill path

- **WHEN** generating host artifacts for Cursor
- **THEN** canonical skills SHALL remain in `.agents/skills/`
- **AND** no `.cursor/skills/` mirror SHALL be created

#### Scenario: Codex skill path

- **WHEN** generating host artifacts for Codex
- **THEN** canonical skills SHALL remain in `.agents/skills/`
- **AND** no `.codex/skills/` mirror SHALL be created

### Requirement: Generated Claude skill mirror

Claude Code SHALL receive generated skill copies under `.claude/skills/` because Claude Code does not read `.agents/skills/` directly.

#### Scenario: Claude skill path

- **WHEN** generating host artifacts for Claude Code
- **THEN** each canonical skill in `.agents/skills/<name>/SKILL.md` SHALL be copied or rendered to `.claude/skills/<name>/SKILL.md`
- **AND** the generated file SHALL include a managed sentinel that identifies it as derived from `.agents/skills/<name>/SKILL.md`
