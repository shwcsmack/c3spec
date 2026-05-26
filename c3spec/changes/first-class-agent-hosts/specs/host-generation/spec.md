## ADDED Requirements

### Requirement: Canonical `.agents/` artifacts

The repository SHALL maintain `.agents/` as the canonical source of truth for c3spec host artifacts.

#### Scenario: Canonical directory structure

- **WHEN** c3spec canonical artifacts are present
- **THEN** skills SHALL live under `.agents/skills/<skill-name>/SKILL.md`
- **AND** agent role manifests SHALL live under `.agents/agents/*.yaml`
- **AND** hook source artifacts SHALL live under `.agents/hooks/`

#### Scenario: Required canonical skills

- **WHEN** c3spec initializes or updates canonical artifacts
- **THEN** `.agents/skills/` SHALL include:
  - `c3spec-start`
  - `c3spec-tier1-fix`
  - `c3spec-tier2-feature`
  - `c3spec-subagent-dev`
  - `c3spec-host-adapter`

#### Scenario: Required canonical agent roles

- **WHEN** c3spec initializes or updates canonical agent manifests
- **THEN** `.agents/agents/` SHALL include role manifests for:
  - `implementer`
  - `spec-reviewer`
  - `quality-reviewer`

### Requirement: Native subagent generation

c3spec SHALL render canonical agent role manifests into each supported host's native subagent format.

#### Scenario: Cursor agent generation

- **WHEN** rendering Cursor artifacts
- **THEN** each canonical agent manifest SHALL produce `.cursor/agents/<name>.md`
- **AND** the file SHALL contain Cursor-compatible markdown frontmatter and instructions

#### Scenario: Claude Code agent generation

- **WHEN** rendering Claude Code artifacts
- **THEN** each canonical agent manifest SHALL produce `.claude/agents/<name>.md`
- **AND** the file SHALL contain Claude-compatible markdown frontmatter and instructions

#### Scenario: Codex agent generation

- **WHEN** rendering Codex artifacts
- **THEN** each canonical agent manifest SHALL produce `.codex/agents/<name>.toml`
- **AND** the TOML SHALL include `name`, `description`, and `developer_instructions`
- **AND** generated TOML SHALL parse successfully

### Requirement: Explicit subagent workflow instructions

Canonical c3spec skills SHALL explicitly instruct supported hosts to dispatch named subagent roles when the workflow calls for implementation and review.

#### Scenario: Workflow dispatches named roles

- **WHEN** `c3spec-subagent-dev` executes an implementation stage
- **THEN** it SHALL instruct the host to dispatch `implementer` agents for implementation work
- **AND** dispatch `spec-reviewer` agents for spec compliance review
- **AND** dispatch `quality-reviewer` agents for code quality review
- **AND** mark work complete only after the required reviews pass

#### Scenario: Host adapter maps role names

- **WHEN** a canonical skill says to dispatch a named role
- **THEN** `c3spec-host-adapter` SHALL describe how to map that role to the current host's native subagent mechanism
- **AND** the workflow SHALL fail loudly if the current host is not Cursor, Claude Code, or Codex

### Requirement: Host hook generation

c3spec SHALL generate host-specific hook configuration from canonical hook artifacts where the host supports hooks.

#### Scenario: Memory scan hook source

- **WHEN** canonical hooks are initialized
- **THEN** `.agents/hooks/` SHALL include a memory-scan hook source
- **AND** the hook SHALL surface or load `c3spec/memory/MEMORY.md` at session start when the host executes hooks

#### Scenario: Cursor hook output

- **WHEN** rendering Cursor artifacts
- **THEN** c3spec SHALL write `.cursor/hooks.json` with Cursor-compatible event names and command references

#### Scenario: Claude hook output

- **WHEN** rendering Claude Code artifacts
- **THEN** c3spec SHALL write or update `.claude/settings.json` with Claude-compatible hook configuration

#### Scenario: Codex hook output

- **WHEN** rendering Codex artifacts
- **THEN** c3spec SHALL write `.codex/hooks.json` with Codex-compatible event names
- **AND** hook behavior SHALL account for Codex project trust gating

### Requirement: Generated artifact drift protection

Generated host artifacts SHALL include managed sentinel metadata that allows c3spec to detect whether a generated file has been hand-edited.

#### Scenario: Regenerating unchanged generated file

- **WHEN** a generated file still matches the last generated hash
- **THEN** `c3spec sync` or `c3spec update` MAY overwrite it with newly rendered content

#### Scenario: Regenerating hand-edited generated file

- **WHEN** a generated file's current content does not match the last generated hash
- **THEN** c3spec SHALL warn that the file appears hand-edited
- **AND** SHALL avoid overwriting it unless the user supplies a force option or confirms the overwrite
