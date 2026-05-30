# workspace-open Specification

## Purpose
Define how c3spec opens a workspace working set through a selected agent or
VS Code editor, including workspace selection, opener resolution, launch
behavior, linked path visibility, and durable workspace guidance.

## Requirements
### Requirement: [WORKSPACE-OPEN-001] Workspace Open Command
c3spec SHALL provide a `workspace open` command that opens an c3spec workspace working set through an agent or VS Code editor.

#### Scenario: Opening the current workspace
- **GIVEN** the command runs from inside an c3spec workspace
- **WHEN** the user runs `c3spec workspace open`
- **THEN** c3spec SHALL open that current workspace
- **AND** it SHALL use the selected opener for that workspace

#### Scenario: Opening a named workspace
- **GIVEN** a workspace named `platform` is known locally
- **WHEN** the user runs `c3spec workspace open platform`
- **THEN** c3spec SHALL open the `platform` workspace

#### Scenario: Opening a named workspace with the selection flag
- **GIVEN** a workspace named `platform` is known locally
- **WHEN** the user runs `c3spec workspace open --workspace platform`
- **THEN** c3spec SHALL open the `platform` workspace

#### Scenario: Conflicting workspace selectors
- **GIVEN** workspaces named `platform` and `checkout` are known locally
- **WHEN** the user runs `c3spec workspace open platform --workspace checkout`
- **THEN** c3spec SHALL fail with a clear conflict error
- **AND** the error SHALL name both conflicting selectors

#### Scenario: Handling unsupported preview and JSON flags
- **WHEN** the user runs `c3spec workspace open` with `--prepare-only` or `--json`
- **THEN** c3spec SHALL fail with a clear error that the root workspace open surface supports launching through a selected opener
- **AND** the error SHALL direct preview or machine-readable context needs to a future context/query surface

#### Scenario: Handling change-scoped open before workspace planning
- **WHEN** the user runs `c3spec workspace open --change <id>`
- **THEN** c3spec SHALL fail with a clear error that this slice supports root workspace open
- **AND** the error SHALL direct change-scoped open behavior to future workspace change planning

### Requirement: [WORKSPACE-OPEN-002] Workspace Selection For Open
c3spec SHALL resolve the workspace to open using current workspace context, local registry state, and interactive selection.

#### Scenario: Current workspace wins
- **GIVEN** the command runs from a workspace folder or one of its subdirectories
- **AND** no workspace name is provided
- **WHEN** the user runs `c3spec workspace open`
- **THEN** c3spec SHALL open the current workspace

#### Scenario: Auto-selecting the only known workspace
- **GIVEN** the command runs outside a workspace
- **AND** exactly one workspace is known locally
- **WHEN** the user runs `c3spec workspace open`
- **THEN** c3spec SHALL open that known workspace directly

#### Scenario: Picking from multiple workspaces
- **GIVEN** the command runs outside a workspace
- **AND** multiple workspaces are known locally
- **AND** the terminal is interactive
- **WHEN** the user runs `c3spec workspace open`
- **THEN** c3spec SHALL present a picker with workspace names and locations
- **AND** it SHALL open the workspace the user selects

#### Scenario: Non-interactive ambiguous selection
- **GIVEN** the command runs outside a workspace
- **AND** multiple workspaces are known locally
- **AND** the terminal is non-interactive
- **WHEN** the user runs `c3spec workspace open`
- **THEN** c3spec SHALL fail with a clear message listing the known workspace names
- **AND** it SHALL ask the user to pass a workspace name

#### Scenario: No known workspace
- **GIVEN** the command runs outside a workspace
- **AND** no workspaces are known locally
- **WHEN** the user runs `c3spec workspace open`
- **THEN** c3spec SHALL fail with a clear message
- **AND** it SHALL suggest running `c3spec workspace setup`

### Requirement: [WORKSPACE-OPEN-003] Opener Resolution
c3spec SHALL resolve the opener from command overrides, workspace-local preference, or an interactive prompt.

#### Scenario: Conflicting opener overrides
- **WHEN** the user runs `c3spec workspace open --agent codex --editor`
- **THEN** c3spec SHALL fail with a clear conflict error naming `--agent` and `--editor`
- **AND** it SHALL avoid launching any opener
- **AND** it SHALL leave the stored preferred opener unchanged

#### Scenario: Using the stored preferred opener
- **GIVEN** the workspace has a machine-local preferred opener
- **WHEN** the user runs `c3spec workspace open` using default opener resolution
- **THEN** c3spec SHALL use the stored preferred opener

#### Scenario: Overriding with an agent for one session
- **GIVEN** the workspace has a stored preferred opener
- **WHEN** the user runs `c3spec workspace open --agent codex`
- **THEN** c3spec SHALL use pi runtime for that open command
- **AND** it SHALL leave the stored preferred opener unchanged

#### Scenario: Overriding with VS Code editor for one session
- **GIVEN** the workspace has a stored preferred opener
- **WHEN** the user runs `c3spec workspace open --editor`
- **THEN** c3spec SHALL open the workspace in VS Code editor mode
- **AND** it SHALL leave the stored preferred opener unchanged

#### Scenario: Prompting when no opener is stored
- **GIVEN** the workspace has no stored preferred opener
- **AND** the terminal is interactive
- **WHEN** the user runs `c3spec workspace open` using default opener resolution
- **THEN** c3spec SHALL prompt the user to choose an opener
- **AND** it SHALL only offer openers with detected executables

#### Scenario: Failing when no opener can be prompted
- **GIVEN** the workspace has no stored preferred opener
- **AND** the terminal is interactive
- **AND** no supported opener executable is available on `PATH`
- **WHEN** the user runs `c3spec workspace open` using default opener resolution
- **THEN** c3spec SHALL fail with a clear message that no supported opener is available
- **AND** it SHALL avoid prompting with unlaunchable choices

#### Scenario: Failing when no opener is stored in non-interactive mode
- **GIVEN** the workspace has no stored preferred opener
- **AND** the terminal is non-interactive
- **WHEN** the user runs `c3spec workspace open` using default opener resolution
- **THEN** c3spec SHALL fail with a clear message
- **AND** it SHALL ask the user to pass `--agent <tool>` or `--editor`

### Requirement: [WORKSPACE-OPEN-004] Opener Launch Behavior
c3spec SHALL launch the selected opener using existing workspace files and linked path state.

#### Scenario: Opening VS Code editor
- **GIVEN** the user selected the VS Code editor opener
- **WHEN** `code` is available on `PATH`
- **THEN** c3spec SHALL open the workspace's maintained `.code-workspace` file with VS Code

#### Scenario: Opening GitHub Copilot in VS Code
- **GIVEN** the user selected `--agent github-copilot`
- **WHEN** `code` is available on `PATH`
- **THEN** c3spec SHALL open the workspace's maintained `.code-workspace` file with VS Code
- **AND** it SHALL treat this as the VS Code Copilot experience

#### Scenario: Opening pi runtime
- **GIVEN** the user selected `--agent codex`
- **WHEN** `codex` is available on `PATH`
- **THEN** c3spec SHALL launch pi runtime from the workspace root
- **AND** it SHALL attach every linked repo or folder with a valid local path using pi runtime's supported directory attachment mechanism

#### Scenario: Opening Claude
- **GIVEN** the user selected `--agent claude`
- **WHEN** `claude` is available on `PATH`
- **THEN** c3spec SHALL launch Claude from the workspace root
- **AND** it SHALL attach every linked repo or folder with a valid local path using Claude's supported directory attachment mechanism

#### Scenario: Missing opener executable
- **GIVEN** the selected opener requires an executable that is not available on `PATH`
- **WHEN** the user runs `c3spec workspace open`
- **THEN** c3spec SHALL fail with a clear error naming the missing executable
- **AND** it SHALL keep the selected opener as the required opener

#### Scenario: Missing VS Code executable
- **GIVEN** the selected opener is VS Code editor or GitHub Copilot in VS Code
- **AND** `code` is not available on `PATH`
- **WHEN** the user runs `c3spec workspace open`
- **THEN** c3spec SHALL fail with a clear error naming `code`
- **AND** it SHALL include the maintained `.code-workspace` path so the user can open it manually

### Requirement: [WORKSPACE-OPEN-005] Linked Working Set Visibility
c3spec SHALL make linked repos and folders visible for workspace exploration and planning before change creation.

#### Scenario: Attaching valid linked paths
- **GIVEN** a workspace has linked repos or folders with valid local paths
- **WHEN** the user opens the workspace through an opener that supports linked directory attachment
- **THEN** c3spec SHALL include every valid linked path in the opened working set
- **AND** it SHALL support opening before a workspace change exists

#### Scenario: Skipping broken linked paths
- **GIVEN** a workspace has at least one linked path that is missing or not recorded locally
- **WHEN** the user opens the workspace
- **THEN** c3spec SHALL skip the broken linked path
- **AND** it SHALL report that the path was skipped with `c3spec workspace doctor` as the repair path
- **AND** it SHALL continue opening the workspace when the selected opener itself is available

#### Scenario: Opening links with repo-local c3spec state absent
- **GIVEN** a linked repo or folder has a valid local path and repo-local `c3spec/` state is absent
- **WHEN** the user opens the workspace
- **THEN** c3spec SHALL include that link when its local path is valid
- **AND** it SHALL treat missing repo-local c3spec state as an implementation-readiness concern for later workflows while continuing open

### Requirement: [WORKSPACE-OPEN-006] Workspace Open Guidance
c3spec SHALL use durable workspace guidance as the primary context source for root workspace open.

#### Scenario: Launching with existing workspace guidance
- **GIVEN** the workspace has c3spec-managed guidance in `AGENTS.md`
- **WHEN** the user opens the workspace
- **THEN** c3spec SHALL refresh the maintained `.code-workspace` from current linked path state
- **AND** it SHALL launch the selected opener against refreshed workspace files
- **AND** it SHALL use durable workspace files as the primary workspace-open artifact

#### Scenario: Minimal required launch prompt
- **GIVEN** an opener requires an initial prompt argument
- **WHEN** c3spec launches that opener
- **THEN** c3spec SHALL use a minimal prompt such as `Open this c3spec workspace.`
- **AND** durable workspace rules SHALL remain in workspace files
