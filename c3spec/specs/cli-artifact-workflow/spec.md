# cli-artifact-workflow Specification

## Purpose
Define artifact workflow CLI behavior (`status`, `instructions`, `templates`, and setup flows) for scaffolded and active changes.
## Requirements
### Requirement: [CLI-ARTIFACT-WORKFLOW-001] Status Command

The system SHALL display artifact completion status for a change, including scaffolded (empty) changes.

> **Fixes bug**: Previously required `proposal.md` to exist via `getActiveChangeIds()`.

#### Scenario: Show status with all states

- **WHEN** user runs `c3spec status --change <id>`
- **THEN** the system displays each artifact with status indicator:
  - `[x]` for completed artifacts
  - `[ ]` for ready artifacts
  - `[-]` for blocked artifacts (with missing dependencies listed)

#### Scenario: Status shows completion summary

- **WHEN** user runs `c3spec status --change <id>`
- **THEN** output includes completion percentage and count (e.g., "2/4 artifacts complete")

#### Scenario: Status JSON output

- **WHEN** user runs `c3spec status --change <id> --json`
- **THEN** the system outputs JSON with changeName, schemaName, isComplete, and artifacts array

#### Scenario: Status JSON includes apply requirements

- **WHEN** user runs `c3spec status --change <id> --json`
- **THEN** the system outputs JSON with:
  - `changeName`, `schemaName`, `isComplete`, `artifacts` array
  - `applyRequires`: array of artifact IDs needed for apply phase

#### Scenario: Status on scaffolded change

- **WHEN** user runs `c3spec status --change <id>` on a change with no artifacts
- **THEN** system displays all artifacts with their status
- **AND** root artifacts (no dependencies) show as ready `[ ]`
- **AND** dependent artifacts show as blocked `[-]`

#### Scenario: Missing change parameter

- **WHEN** user runs `c3spec status` without `--change`
- **THEN** the system displays an error with list of available changes
- **AND** includes scaffolded changes (directories without proposal.md)

#### Scenario: Unknown change

- **WHEN** user runs `c3spec status --change unknown-id`
- **AND** directory `c3spec/changes/unknown-id/` does not exist
- **THEN** the system displays an error listing all available change directories

### Requirement: [CLI-ARTIFACT-WORKFLOW-002] Next Artifact Discovery

The workflow SHALL use `c3spec status` output to determine what can be created next, rather than a separate next-command surface.

#### Scenario: Discover next artifacts from status output

- **WHEN** a user needs to know which artifact to create next
- **THEN** `c3spec status --change <id>` identifies ready artifacts with `[ ]`
- **AND** no dedicated "next command" is required to continue the workflow

### Requirement: [CLI-ARTIFACT-WORKFLOW-003] Instructions Command

The system SHALL output enriched instructions for creating an artifact, including for scaffolded changes.

#### Scenario: Show enriched instructions

- **WHEN** user runs `c3spec instructions <artifact> --change <id>`
- **THEN** the system outputs:
  - Artifact metadata (ID, output path, description)
  - Template content
  - Dependency status (done/missing)
  - Unlocked artifacts (what becomes available after completion)

#### Scenario: Instructions JSON output

- **WHEN** user runs `c3spec instructions <artifact> --change <id> --json`
- **THEN** the system outputs JSON matching ArtifactInstructions interface

#### Scenario: Unknown artifact

- **WHEN** user runs `c3spec instructions unknown-artifact --change <id>`
- **THEN** the system displays an error listing valid artifact IDs for the schema

#### Scenario: Artifact with unmet dependencies

- **WHEN** user requests instructions for a blocked artifact
- **THEN** the system displays instructions with a warning about missing dependencies

#### Scenario: Instructions on scaffolded change

- **WHEN** user runs `c3spec instructions proposal --change <id>` on a scaffolded change
- **THEN** system outputs template and metadata for creating the proposal
- **AND** does not require any artifacts to already exist

### Requirement: [CLI-ARTIFACT-WORKFLOW-004] Templates Command
The system SHALL show resolved template paths for all artifacts in a schema.

#### Scenario: List template paths with default schema
- **WHEN** user runs `c3spec templates`
- **THEN** the system displays each artifact with its resolved template path using the default schema

#### Scenario: List template paths with custom schema
- **WHEN** user runs `c3spec templates --schema tdd`
- **THEN** the system displays template paths for the specified schema

#### Scenario: Templates JSON output
- **WHEN** user runs `c3spec templates --json`
- **THEN** the system outputs JSON mapping artifact IDs to template paths

#### Scenario: Template resolution source
- **WHEN** displaying template paths
- **THEN** the system indicates whether each template is from user override or package built-in

### Requirement: [CLI-ARTIFACT-WORKFLOW-005] New Change Command
The system SHALL create new change directories with validation.

#### Scenario: Create valid change
- **WHEN** user runs `c3spec new change add-feature`
- **THEN** the system creates `c3spec/changes/add-feature/` directory

#### Scenario: Invalid change name
- **WHEN** user runs `c3spec new change "Add Feature"` with invalid name
- **THEN** the system displays validation error with guidance

#### Scenario: Duplicate change name
- **WHEN** user runs `c3spec new change existing-change` for an existing change
- **THEN** the system displays an error indicating the change already exists

#### Scenario: Create with description
- **WHEN** user runs `c3spec new change add-feature --description "Add new feature"`
- **THEN** the system creates the change directory with description in README.md

### Requirement: [CLI-ARTIFACT-WORKFLOW-006] Workspace Setup Commands
The CLI artifact workflow SHALL expose workspace setup commands before change creation.

#### Scenario: Preparing workspace planning before a change
- **WHEN** a user needs to prepare workspace planning across repos or folders
- **THEN** the CLI SHALL provide commands to set up, list, link, relink, and doctor workspaces
- **AND** those commands SHALL not require an active workspace change

#### Scenario: Listing workspaces with a short command
- **WHEN** a user wants a concise workspace list command
- **THEN** the CLI SHALL support `c3spec workspace ls`
- **AND** it SHALL behave the same as `c3spec workspace list`

#### Scenario: Keeping setup separate from agent launch
- **WHEN** a user completes workspace setup
- **THEN** the setup workflow SHALL leave agent launch and workspace open behavior to a later workflow
- **AND** setup SHALL not require a preferred agent choice

#### Scenario: Avoiding public direct creation
- **WHEN** users create a workspace in the first workspace setup flow
- **THEN** the CLI SHALL use `c3spec workspace setup`
- **AND** it SHALL not expose `c3spec workspace create` as the public creation path

### Requirement: [CLI-ARTIFACT-WORKFLOW-007] Schema Selection
The system SHALL support custom schema selection for workflow commands.

#### Scenario: Default schema
- **WHEN** user runs workflow commands without `--schema`
- **THEN** the system uses the "spec-driven" schema

#### Scenario: Custom schema
- **WHEN** user runs `c3spec status --change <id> --schema tdd`
- **THEN** the system uses the specified schema for artifact graph

#### Scenario: Unknown schema
- **WHEN** user specifies an unknown schema
- **THEN** the system displays an error listing available schemas

### Requirement: [CLI-ARTIFACT-WORKFLOW-008] Output Formatting
The system SHALL provide consistent output formatting.

#### Scenario: Color output
- **WHEN** terminal supports colors
- **THEN** status indicators use colors: green (done), yellow (ready), red (blocked)

#### Scenario: No color output
- **WHEN** `--no-color` flag is used or NO_COLOR environment variable is set
- **THEN** output uses text-only indicators without ANSI colors

#### Scenario: Progress indication
- **WHEN** loading change state takes time
- **THEN** the system displays a spinner during loading

### Requirement: [CLI-ARTIFACT-WORKFLOW-009] Experimental Isolation
The system SHALL implement artifact workflow commands in isolation for easy removal.

#### Scenario: Single file implementation
- **WHEN** artifact workflow feature is implemented
- **THEN** all commands are in `src/commands/artifact-workflow.ts`

#### Scenario: Help text marking
- **WHEN** user runs `--help` on any artifact workflow command
- **THEN** help text indicates the command is experimental

### Requirement: [CLI-ARTIFACT-WORKFLOW-010] Schema Apply Block

The system SHALL support an `apply` block in schema definitions that controls when and how implementation begins.

#### Scenario: Schema with apply block

- **WHEN** a schema defines an `apply` block
- **THEN** the system uses `apply.requires` to determine which artifacts must exist before apply
- **AND** uses `apply.tracks` to identify the file for progress tracking (or null if none)
- **AND** uses `apply.instruction` for guidance shown to the agent

#### Scenario: Schema without apply block

- **WHEN** a schema has no `apply` block
- **THEN** the system requires all artifacts to exist before apply is available
- **AND** uses default instruction: "All artifacts complete. Proceed with implementation."

### Requirement: [CLI-ARTIFACT-WORKFLOW-011] Apply Instructions Command

The system SHALL generate schema-aware apply instructions via `c3spec instructions apply`, and tier-aware helper skills SHALL use those instructions together with the tier lifecycle contract before starting implementation.

#### Scenario: Generate apply instructions

- **WHEN** user runs `c3spec instructions apply --change <id>`
- **AND** all required artifacts (per schema's `apply.requires`) exist
- **THEN** the system outputs context files, schema-specific instruction text, progress tracking information when available, and the current apply state

#### Scenario: Apply blocked by missing artifacts

- **WHEN** user runs `c3spec instructions apply --change <id>`
- **AND** required artifacts are missing
- **THEN** the system indicates apply is blocked
- **AND** lists which artifacts must be created first

#### Scenario: Tier helper preserves implementation discipline

- **WHEN** a tier-aware helper receives ready apply instructions
- **THEN** it SHALL still check tier lifecycle metadata before starting implementation
- **AND** it SHALL route implementation through the tier's prescribed execution path rather than directly editing tasks when the lifecycle contract requires subagent review

#### Scenario: Apply instructions JSON output

- **WHEN** user runs `c3spec instructions apply --change <id> --json`
- **THEN** the system outputs JSON with:
  - `contextFiles`: object mapping artifact IDs to arrays of concrete paths for existing artifacts
  - `instruction`: the apply instruction text
  - `tracks`: path to progress file or null
  - `applyRequires`: list of required artifact IDs

### Requirement: [CLI-ARTIFACT-WORKFLOW-012] Tier lifecycle metadata is readable by agents

Workflow artifact commands and skills SHALL preserve enough concrete paths and artifact context for agents to combine schema-backed status with tier lifecycle metadata.

#### Scenario: Status reports schema-backed artifacts

- **WHEN** a user runs `c3spec status --change <id> --json` for a schema-backed change
- **THEN** the output SHALL continue to include schema name, completion state, artifact statuses, planning home, change root, artifact paths, and action context
- **AND** agents SHALL be able to read those paths without assuming a hardcoded change root

#### Scenario: Resume helper combines status with tier metadata

- **WHEN** a change has both schema-backed artifacts and a tier lifecycle metadata file
- **THEN** resume helpers SHALL use status output for artifact existence and lifecycle metadata for tier-specific gates
- **AND** they SHALL NOT treat schema artifact readiness as permission to skip human approval gates

### Requirement: [CLI-ARTIFACT-WORKFLOW-013] Artifact workflow supports tier helper checks without schema rewrite

The artifact workflow SHALL support tier-aware helpers without requiring every tier to be encoded as a separate schema in this pass.

#### Scenario: Tier 1 has non-schema lifecycle metadata

- **WHEN** a Tier 1 change folder exists with lifecycle metadata but no full schema graph
- **THEN** resume/apply skills SHALL be allowed to use the lifecycle contract rather than forcing the change through the full schema artifact graph
- **AND** CLI schema migration SHALL NOT be required for Tier 1 lightweight fixes

#### Scenario: Schema-backed changes keep existing status behavior

- **WHEN** a Tier 2 or Tier 3 change uses an existing schema-backed artifact graph
- **THEN** existing `status` and `instructions` behavior SHALL remain available
- **AND** lifecycle-aware helpers SHALL treat the CLI output as artifact path/status context, not the entire workflow contract

### Requirement: [CLI-ARTIFACT-WORKFLOW-014] Tool selection flag

The `artifact-experimental-setup` command SHALL accept a `--tool <tool-id>` flag to specify the target AI tool.

#### Scenario: Specify tool via flag

- **WHEN** user runs `c3spec artifact-experimental-setup --tool cursor`
- **THEN** skill files are generated in `.cursor/skills/`
- **AND** command files are generated using pi-only command/skill format

#### Scenario: Missing tool flag

- **WHEN** user runs `c3spec artifact-experimental-setup` without `--tool`
- **THEN** the system displays an error requiring the `--tool` flag
- **AND** lists valid tool IDs in the error message

#### Scenario: Unknown tool ID

- **WHEN** user runs `c3spec artifact-experimental-setup --tool unknown-tool`
- **AND** the tool ID is not in `AI_TOOLS`
- **THEN** the system displays an error listing valid tool IDs

#### Scenario: Tool without skillsDir

- **WHEN** user specifies a tool that has no `skillsDir` configured
- **THEN** the system displays an error indicating skill generation is not supported for that tool

#### Scenario: Tool without command adapter

- **WHEN** user specifies a tool that has `skillsDir` but no command adapter registered
- **THEN** skill files are generated successfully
- **AND** command generation is skipped with informational message

### Requirement: [CLI-ARTIFACT-WORKFLOW-015] Output messaging

The setup command SHALL display clear output about what was generated.

#### Scenario: Show target tool in output

- **WHEN** setup command runs successfully
- **THEN** output includes the target tool name (e.g., "Setting up for pi...")

#### Scenario: Show generated paths

- **WHEN** setup command completes
- **THEN** output lists all generated skill file paths
- **AND** lists all generated command file paths (if applicable)

#### Scenario: Show skipped commands message

- **WHEN** command generation is skipped due to missing adapter
- **THEN** output includes message: "Command generation skipped - no adapter for <tool>"

### Requirement: [CLI-ARTIFACT-WORKFLOW-016] Status JSON provides planning context
The status command SHALL provide machine-readable planning context for repo-local and workspace changes.

#### Scenario: Reporting planning home
- **WHEN** a user runs `c3spec status --change <id> --json`
- **THEN** the output SHALL identify whether the change is repo-local or workspace-scoped
- **AND** it SHALL include the planning home root and change root

#### Scenario: Reporting concrete artifact paths
- **WHEN** a user runs `c3spec status --change <id> --json`
- **THEN** the output SHALL include concrete paths for existing artifacts
- **AND** agents SHALL be able to read those paths without assuming `c3spec/changes/<id>/`
- **AND** workspace-scoped nested spec paths SHALL be reported without flattening the area or capability path

#### Scenario: Reporting workspace affected areas
- **GIVEN** the change is workspace-scoped
- **WHEN** a user runs `c3spec status --change <id> --json`
- **THEN** the output SHALL include known affected areas
- **AND** it SHALL indicate when affected areas remain unresolved without requiring an additional area manifest artifact

#### Scenario: Reporting next steps
- **WHEN** a user runs `c3spec status --change <id> --json`
- **THEN** the output SHALL include next step guidance for agents
- **AND** the guidance SHALL use plain action language

### Requirement: [CLI-ARTIFACT-WORKFLOW-017] Status JSON action context
The status command SHALL expose action context that lets agents act without hardcoded filesystem assumptions.

#### Scenario: Planning action context
- **WHEN** a workspace change is still in planning
- **THEN** status JSON SHALL identify the planning artifacts agents may read or update
- **AND** it SHALL indicate that linked repos and folders are context for exploration

#### Scenario: Implementation action context
- **WHEN** a workspace change has a selected affected area for implementation
- **THEN** status JSON SHALL include the allowed edit root for that area
- **AND** it SHALL avoid authorizing edits outside that selected area

#### Scenario: Repo-local action context
- **GIVEN** the change is repo-local
- **WHEN** a user runs `c3spec status --change <id> --json`
- **THEN** status JSON SHALL preserve existing artifact status behavior
- **AND** it SHALL report a repo-local planning home for agents that use action context

### Requirement: [CLI-ARTIFACT-WORKFLOW-018] Instructions use resolved planning paths
Artifact and apply instructions SHALL use resolved planning paths rather than hardcoded repo-local change paths.

#### Scenario: Workspace artifact instructions
- **GIVEN** the change is workspace-scoped
- **WHEN** a user runs `c3spec instructions <artifact> --change <id> --json`
- **THEN** instruction output SHALL point to the artifact path under the workspace change root
- **AND** it SHALL not instruct the agent to write under a linked repo unless an explicit implementation context allows it

#### Scenario: Repo-local artifact instructions
- **GIVEN** the change is repo-local
- **WHEN** a user runs `c3spec instructions <artifact> --change <id> --json`
- **THEN** instruction output SHALL preserve existing repo-local paths

### Requirement: [CLI-ARTIFACT-WORKFLOW-019] Workflow skills use CLI artifact context
Generated workflow skills SHALL use c3spec CLI output as the source of truth for artifact locations.

#### Scenario: Skills inspect status before artifact work
- **WHEN** a generated workflow skill needs to inspect or create artifacts for a change
- **THEN** it SHALL instruct the agent to run `c3spec status --change <id> --json`
- **AND** it SHALL use returned planning context and artifact paths rather than assuming a repo-local change path

#### Scenario: Skills use instructions before writing artifacts
- **WHEN** a generated workflow skill is about to create or update an artifact
- **THEN** it SHALL instruct the agent to run `c3spec instructions <artifact> --change <id> --json`
- **AND** it SHALL write to the resolved artifact path returned by the command

#### Scenario: Skills avoid hardcoded repo-local paths
- **WHEN** generated workflow skills describe artifact locations
- **THEN** they SHALL avoid hardcoded examples that require changes to live under `c3spec/changes/<id>/`
- **AND** any examples SHALL defer to CLI-reported paths for repo-local and workspace-scoped changes

#### Scenario: Skills guard unsupported workspace workflows
- **GIVEN** a generated workflow skill is selected by the global profile
- **AND** the workflow does not yet have full workspace-scoped behavior in this slice
- **WHEN** the skill is used for a workspace-scoped change
- **THEN** it SHALL tell the agent that the workspace action is not supported yet
- **AND** it SHALL not instruct the agent to fall back to repo-local paths or edit linked repos without an explicit allowed edit root

### Requirement: [CLI-ARTIFACT-WORKFLOW-020] Workspace schema instructions
Workflow commands SHALL use the workspace planning schema instructions for workspace-scoped changes that use that schema.

#### Scenario: Workspace planning artifact order
- **GIVEN** a workspace-scoped change uses schema `workspace-planning`
- **WHEN** a user runs `c3spec status --change <id> --json`
- **THEN** the artifact list SHALL reflect the workspace planning schema
- **AND** it SHALL include the normal proposal, specs, design, and tasks artifacts

#### Scenario: Workspace specs instructions
- **GIVEN** a workspace-scoped change uses schema `workspace-planning`
- **WHEN** a user requests instructions for the specs artifact
- **THEN** instruction output SHALL guide the agent to organize area-specific requirements under workspace-scoped `specs/` paths
- **AND** it SHALL not require all affected areas to be finalized before planning can continue
- **AND** it SHALL not instruct the agent to create repo-local spec files while the change is still in workspace planning

### Requirement: [CLI-ARTIFACT-WORKFLOW-021] Artifact workflow uses fixed c3spec contract

Artifact workflow commands SHALL operate using c3spec's fixed workflow contract and SHALL NOT require schema resolution from package/project schema directories.

#### Scenario: Change creation without schema flag

- **WHEN** a user creates a new change with default workflow commands
- **THEN** the command SHALL create workflow metadata and artifact paths using built-in c3spec behavior
- **AND** it SHALL NOT require or expose a `--schema` selector for standard operation

#### Scenario: Schema directories are not runtime dependencies

- **WHEN** workflow status/instructions are loaded
- **THEN** the runtime SHALL not resolve templates from `schemas/*` or `c3spec/schemas/*`
- **AND** workflow guidance SHALL come from fixed command/skill logic

### Requirement: [CLI-ARTIFACT-WORKFLOW-022] Subagent bootstrap CLI command

The CLI SHALL provide a validate-only bootstrap command for subagent dispatch readiness.

#### Scenario: Bootstrap command requires change identifier
- **WHEN** a user runs `c3spec subagent bootstrap`
- **THEN** the command SHALL require `--change <id>`
- **AND** it SHALL exit non-zero with usage guidance when `--change` is missing

#### Scenario: Tier is derived from disk metadata
- **WHEN** bootstrap runs for a change
- **THEN** it SHALL derive tier from on-disk change metadata
- **AND** it SHALL fail with a dedicated failure class when tier cannot be derived unambiguously

#### Scenario: Validate-only behavior
- **WHEN** bootstrap runs
- **THEN** it SHALL validate prerequisites without mutating user/project state
- **AND** it SHALL output actionable remediation for failed checks

#### Scenario: Required and informational check categories
- **WHEN** bootstrap evaluates dispatch readiness
- **THEN** it SHALL run required checks for `runtime`, `artifacts`, and `roles`
- **AND** it SHALL run `memory` as informational (non-blocking)

#### Scenario: Strict gating exit semantics
- **WHEN** any required check fails
- **THEN** bootstrap SHALL exit non-zero
- **AND** it SHALL use a distinct exit code for each failure class
- **AND** it SHALL exit `0` only when all required checks pass

#### Scenario: JSON output contract
- **WHEN** bootstrap is run with `--json`
- **THEN** it SHALL emit machine-readable output including top-level pass/fail status, check results with stable IDs/categories, failure details, and next-step guidance

