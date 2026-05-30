# legacy-cleanup Specification

## Purpose
Define detection and cleanup behavior for legacy c3spec artifacts during initialization and update workflows.

## Requirements
### Requirement: [LEGACY-CLEANUP-001] Legacy artifact detection

The system SHALL detect legacy c3spec artifacts from previous init versions.

#### Scenario: Detecting legacy config files

- **WHEN** running c3spec package-driven project setup on an existing project
- **THEN** the system SHALL check for config files with c3spec markers:
  - `CLAUDE.md`
  - `.cursorrules`
  - `.windsurfrules`
  - `.clinerules`
  - `.kilocode_rules`
  - `.github/copilot-instructions.md`
  - `.amazonq/instructions.md`
  - `CODEBUDDY.md`
  - `IFLOW.md`
  - And all other tool config files from the legacy ToolRegistry

#### Scenario: Detecting legacy slash command directories

- **WHEN** running c3spec package-driven project setup on an existing project
- **THEN** the system SHALL check for old slash command directories:
  - `.claude/commands/c3spec/`
  - `.cursor/commands/c3spec/` (note: old format used `c3spec-*.md` in commands root)
  - `.windsurf/workflows/c3spec-*.md`
  - And equivalent directories for all tools in the legacy SlashCommandRegistry

#### Scenario: Detecting legacy c3spec structure files

- **WHEN** running c3spec package-driven project setup on an existing project
- **THEN** the system SHALL check for:
  - `c3spec/AGENTS.md`
  - `c3spec/project.md` (for migration messaging only, not deleted)
  - Root `AGENTS.md` with c3spec markers

### Requirement: [LEGACY-CLEANUP-002] Legacy cleanup confirmation

The system SHALL prompt for confirmation before removing legacy artifacts.

#### Scenario: Prompting for cleanup when legacy detected

- **WHEN** legacy artifacts are detected
- **THEN** the system SHALL display what was found
- **AND** prompt: "Legacy files detected. Upgrade and clean up? [Y/n]"
- **AND** default to Yes if user presses Enter

#### Scenario: User confirms cleanup

- **WHEN** user responds Y or presses Enter
- **THEN** the system SHALL remove legacy artifacts
- **AND** proceed with skill-based setup

#### Scenario: User declines cleanup

- **WHEN** user responds N
- **THEN** the system SHALL abort initialization
- **AND** display message suggesting manual cleanup or using `--force` flag

#### Scenario: Non-interactive mode

- **WHEN** running with `--no-interactive` or in CI environment
- **AND** legacy artifacts are detected
- **THEN** the system SHALL abort with exit code 1
- **AND** display detected legacy artifacts
- **AND** suggest running interactively or using `--force` flag

### Requirement: [LEGACY-CLEANUP-003] Surgical removal of config file content

The system SHALL preserve user content when removing c3spec markers from config files.

#### Scenario: Config file with only c3spec content

- **WHEN** a config file contains only c3spec marker block (whitespace outside is acceptable)
- **THEN** the system SHALL remove the c3spec marker block
- **AND** preserve the file (even if empty or whitespace-only)
- **AND** NOT delete the file (config files belong to the user's project root)

#### Scenario: Config file with mixed content

- **WHEN** a config file contains content outside c3spec markers
- **THEN** the system SHALL remove only the `<!-- OPENSPEC:START -->` to `<!-- OPENSPEC:END -->` block
- **AND** preserve all content before and after the markers
- **AND** clean up any resulting double blank lines

#### Scenario: Root AGENTS.md with mixed content

- **WHEN** root `AGENTS.md` contains c3spec markers AND other content
- **THEN** the system SHALL remove only the c3spec marker block
- **AND** preserve the rest of the file

### Requirement: [LEGACY-CLEANUP-004] Legacy directory removal

The system SHALL remove legacy slash command directories entirely.

#### Scenario: Removing old slash command directory

- **WHEN** a legacy slash command directory exists (e.g., `.claude/commands/c3spec/`)
- **THEN** the system SHALL delete the entire directory and its contents
- **AND** NOT delete the parent directory (e.g., `.claude/commands/` remains)

#### Scenario: Removing legacy AGENTS.md

- **WHEN** `c3spec/AGENTS.md` exists
- **THEN** the system SHALL delete the file
- **AND** NOT delete the `c3spec/` directory itself

### Requirement: [LEGACY-CLEANUP-005] project.md migration hint

The system SHALL preserve project.md and display a migration hint instead of deleting it.

#### Scenario: project.md exists during upgrade

- **WHEN** `c3spec/project.md` exists during legacy cleanup
- **THEN** the system SHALL NOT delete the file
- **AND** the system SHALL display a migration hint in the output:
  ```
  Manual migration needed:
    → c3spec/project.md still exists
      Move useful content to config.yaml's "context:" field, then delete
  ```

#### Scenario: project.md migration rationale

- **GIVEN** project.md may contain user-written project documentation
- **AND** config.yaml's context field serves the same purpose (auto-injected into artifacts)
- **WHEN** displaying the migration hint
- **THEN** users can migrate manually or use `/opsx:explore` to get AI assistance

### Requirement: [LEGACY-CLEANUP-006] Cleanup reporting

The system SHALL report what was cleaned up.

#### Scenario: Displaying cleanup summary

- **WHEN** legacy cleanup completes
- **THEN** the system SHALL display a summary section:
  ```
  Cleaned up legacy files:
    ✓ Removed c3spec markers from CLAUDE.md
    ✓ Removed .claude/commands/c3spec/ (replaced by /opsx:*)
    ✓ Removed c3spec/AGENTS.md (no longer needed)
  ```
- **AND IF** `c3spec/project.md` exists
- **THEN** the system SHALL display a separate migration section:
  ```
  Manual migration needed:
    → c3spec/project.md still exists
      Move useful content to config.yaml's "context:" field, then delete
  ```

#### Scenario: No legacy detected

- **WHEN** no legacy artifacts are found
- **THEN** the system SHALL NOT display the cleanup section
- **AND** proceed directly with skill setup

### Requirement: [LEGACY-CLEANUP-007] Full-repository cleanup audits use risk-banded classification

The workflow SHALL classify candidates into risk bands and require explicit approval for high-risk removals when performing full codebase cleanup investigations.

#### Scenario: Producing a cleanup plan from a full-repo audit

- **WHEN** an audit identifies removable or questionable repository surfaces
- **THEN** the resulting plan SHALL classify each candidate as Band A, Band B, or Band C
- **AND** SHALL include keep/remove rationale and validation expectations per candidate

#### Scenario: Handling high-risk cleanup candidates

- **WHEN** a candidate is classified as Band C (runtime-facing or highly coupled)
- **THEN** deletion SHALL NOT proceed without explicit user approval for that item
- **AND** the plan SHALL require dedicated validation before and after removal

